import { eq } from "drizzle-orm";

import { eligibilityCache } from "../../db/schema.ts";
import { envBoolean, envCsv } from "./env.ts";
import { createDb } from "./db.ts";
import { isActiveHumanNodeViaRpc } from "./humanodeRpc.ts";
import { getSimConfig } from "./simConfig.ts";

type Env = Record<string, string | undefined>;

export type GateResult = {
  eligible: boolean;
  reason?: string;
  expiresAt: string;
};

const memory = new Map<string, GateResult>();

export async function checkEligibility(
  env: Env,
  address: string,
  requestUrl?: string,
): Promise<GateResult> {
  const eligibleAddresses = new Set(
    envCsv(env, "DEV_ELIGIBLE_ADDRESSES").map((a) => a.trim()),
  );

  const ttlMs = 10 * 60_000;
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();

  if (envBoolean(env, "DEV_BYPASS_GATE")) return { eligible: true, expiresAt };
  if (eligibleAddresses.has(address.trim()))
    return { eligible: true, expiresAt };

  let envWithRpc: Env = env;
  if (!env.HUMANODE_RPC_URL && requestUrl) {
    const cfg = await getSimConfig(env, requestUrl);
    const fromCfg = (cfg?.humanodeRpcUrl ?? "").trim();
    if (fromCfg) {
      envWithRpc = { ...env, HUMANODE_RPC_URL: fromCfg };
    }
  }

  if (env.DATABASE_URL) {
    const db = createDb(env);
    const now = new Date();
    const rows = await db
      .select({
        isActive: eligibilityCache.isActiveHumanNode,
        expiresAt: eligibilityCache.expiresAt,
        reasonCode: eligibilityCache.reasonCode,
      })
      .from(eligibilityCache)
      .where(eq(eligibilityCache.address, address))
      .limit(1);
    const row = rows[0];
    if (row && row.expiresAt.getTime() > now.getTime()) {
      return {
        eligible: row.isActive === 1,
        reason:
          row.isActive === 1 ? undefined : (row.reasonCode ?? "not_eligible"),
        expiresAt: row.expiresAt.toISOString(),
      };
    }

    let eligible = false;
    let reason: string | undefined = undefined;
    try {
      eligible = await isActiveHumanNodeViaRpc(envWithRpc, address);
      if (!eligible) reason = "not_in_validator_set";
    } catch (error) {
      eligible = false;
      const message = (error as Error | null)?.message ?? "";
      reason = message.includes("HUMANODE_RPC_URL")
        ? "rpc_not_configured"
        : "rpc_error";
    }

    const nextExpires = new Date(Date.now() + ttlMs);
    await db
      .insert(eligibilityCache)
      .values({
        address,
        isActiveHumanNode: eligible ? 1 : 0,
        checkedAt: new Date(),
        source: "rpc",
        expiresAt: nextExpires,
        reasonCode: eligible ? null : reason,
      })
      .onConflictDoUpdate({
        target: eligibilityCache.address,
        set: {
          isActiveHumanNode: eligible ? 1 : 0,
          checkedAt: new Date(),
          source: "rpc",
          expiresAt: nextExpires,
          reasonCode: eligible ? null : reason,
        },
      });

    return {
      eligible,
      reason: eligible ? undefined : reason,
      expiresAt: nextExpires.toISOString(),
    };
  }

  const cached = memory.get(address);
  if (cached && new Date(cached.expiresAt).getTime() > Date.now())
    return cached;

  let eligible = false;
  let reason: string | undefined = undefined;
  try {
    eligible = await isActiveHumanNodeViaRpc(envWithRpc, address);
    if (!eligible) reason = "not_in_validator_set";
  } catch (error) {
    eligible = false;
    const message = (error as Error | null)?.message ?? "";
    reason = message.includes("HUMANODE_RPC_URL")
      ? "rpc_not_configured"
      : "rpc_error";
  }

  const result: GateResult = {
    eligible,
    reason: eligible ? undefined : reason,
    expiresAt,
  };
  memory.set(address, result);
  return result;
}
