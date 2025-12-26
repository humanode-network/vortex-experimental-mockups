import { eq } from "drizzle-orm";

import { idempotencyKeys } from "../../db/schema.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

type Stored = {
  address: string;
  request: unknown;
  response: unknown;
};

const memory = new Map<string, Stored>();

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export async function getIdempotencyResponse(
  env: Env,
  input: { key: string; address: string; request: unknown },
): Promise<
  | { hit: true; response: unknown }
  | { hit: false }
  | { hit: false; conflict: true }
> {
  if (!env.DATABASE_URL) {
    const existing = memory.get(input.key);
    if (!existing) return { hit: false };
    if (existing.address !== input.address)
      return { hit: false, conflict: true };
    if (stableStringify(existing.request) !== stableStringify(input.request)) {
      return { hit: false, conflict: true };
    }
    return { hit: true, response: existing.response };
  }

  const db = createDb(env);
  const rows = await db
    .select({
      address: idempotencyKeys.address,
      request: idempotencyKeys.request,
      response: idempotencyKeys.response,
    })
    .from(idempotencyKeys)
    .where(eq(idempotencyKeys.key, input.key))
    .limit(1);
  const row = rows[0];
  if (!row) return { hit: false };
  if (row.address !== input.address) return { hit: false, conflict: true };
  if (stableStringify(row.request) !== stableStringify(input.request)) {
    return { hit: false, conflict: true };
  }
  return { hit: true, response: row.response };
}

export async function storeIdempotencyResponse(
  env: Env,
  input: { key: string; address: string; request: unknown; response: unknown },
): Promise<void> {
  if (!env.DATABASE_URL) {
    memory.set(input.key, {
      address: input.address,
      request: input.request,
      response: input.response,
    });
    return;
  }

  const db = createDb(env);
  await db.insert(idempotencyKeys).values({
    key: input.key,
    address: input.address,
    request: input.request,
    response: input.response,
    createdAt: new Date(),
  });
}

export function clearIdempotencyForTests() {
  memory.clear();
}
