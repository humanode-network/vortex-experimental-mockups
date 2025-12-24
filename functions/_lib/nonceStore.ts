import { and, eq, gt, isNull } from "drizzle-orm";

import { authNonces } from "../../db/schema.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

export type NonceStore = {
  create: (input: {
    address: string;
    nonce: string;
    requestIp?: string;
    expiresAt: Date;
  }) => Promise<void>;
  consume: (input: {
    address: string;
    nonce: string;
  }) => Promise<
    | { ok: true }
    | { ok: false; reason: "not_found" | "expired" | "used" | "mismatch" }
  >;
  canIssue: (input: {
    address: string;
    requestIp?: string;
  }) => Promise<
    | { ok: true }
    | { ok: false; reason: "rate_limited"; retryAfterSeconds: number }
  >;
};

const memory = new Map<
  string,
  { address: string; expiresAt: number; usedAt?: number; requestIp?: string }
>();
const memoryIssuedAt = new Map<string, number[]>();

function nowMs(): number {
  return Date.now();
}

export function createNonceStore(env: Env): NonceStore {
  if (!env.DATABASE_URL) {
    return {
      canIssue: async ({ requestIp }) => {
        if (!requestIp) return { ok: true };
        const now = nowMs();
        const windowMs = 60_000;
        const limit = 20;
        const issued = memoryIssuedAt.get(requestIp) ?? [];
        const next = issued.filter((t) => now - t < windowMs);
        if (next.length >= limit) {
          return { ok: false, reason: "rate_limited", retryAfterSeconds: 60 };
        }
        next.push(now);
        memoryIssuedAt.set(requestIp, next);
        return { ok: true };
      },
      create: async ({ address, nonce, expiresAt, requestIp }) => {
        memory.set(nonce, {
          address,
          expiresAt: expiresAt.getTime(),
          requestIp,
        });
      },
      consume: async ({ address, nonce }) => {
        const row = memory.get(nonce);
        if (!row) return { ok: false, reason: "not_found" };
        if (row.address !== address) return { ok: false, reason: "mismatch" };
        if (row.usedAt) return { ok: false, reason: "used" };
        if (nowMs() > row.expiresAt) return { ok: false, reason: "expired" };
        row.usedAt = nowMs();
        return { ok: true };
      },
    };
  }

  const db = createDb(env);

  return {
    canIssue: async ({ requestIp }) => {
      if (!requestIp) return { ok: true };
      const now = new Date();
      const windowStart = new Date(now.getTime() - 60_000);
      const limit = 20;
      const rows = await db
        .select({ nonce: authNonces.nonce })
        .from(authNonces)
        .where(
          and(
            eq(authNonces.requestIp, requestIp),
            gt(authNonces.createdAt, windowStart),
          ),
        )
        .limit(limit + 1);
      if (rows.length > limit) {
        return { ok: false, reason: "rate_limited", retryAfterSeconds: 60 };
      }
      return { ok: true };
    },
    create: async ({ address, nonce, requestIp, expiresAt }) => {
      await db.insert(authNonces).values({
        nonce,
        address,
        requestIp,
        expiresAt,
      });
    },
    consume: async ({ address, nonce }) => {
      const rows = await db
        .select({
          address: authNonces.address,
          expiresAt: authNonces.expiresAt,
          usedAt: authNonces.usedAt,
        })
        .from(authNonces)
        .where(eq(authNonces.nonce, nonce))
        .limit(1);
      const row = rows[0];
      if (!row) return { ok: false, reason: "not_found" };
      if (row.address !== address) return { ok: false, reason: "mismatch" };
      if (row.usedAt) return { ok: false, reason: "used" };
      if (row.expiresAt.getTime() < Date.now())
        return { ok: false, reason: "expired" };

      await db
        .update(authNonces)
        .set({ usedAt: new Date() })
        .where(and(eq(authNonces.nonce, nonce), isNull(authNonces.usedAt)));
      return { ok: true };
    },
  };
}
