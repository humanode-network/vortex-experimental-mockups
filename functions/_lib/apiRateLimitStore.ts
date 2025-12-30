import { eq } from "drizzle-orm";

import { apiRateLimits } from "../../db/schema.ts";
import { createDb } from "./db.ts";
import { envInt } from "./env.ts";

type Env = Record<string, string | undefined>;

type ConsumeInput = {
  bucket: string;
  limit: number;
  windowSeconds: number;
};

type ConsumeResult =
  | { ok: true; remaining: number; resetAt: string }
  | { ok: false; retryAfterSeconds: number; resetAt: string };

export type ApiRateLimitStore = {
  consume: (input: ConsumeInput) => Promise<ConsumeResult>;
};

const memoryBuckets = new Map<string, { count: number; resetAtMs: number }>();

function nowMs(): number {
  return Date.now();
}

function consumeFromMemory(input: ConsumeInput): ConsumeResult {
  const key = input.bucket;
  const now = nowMs();
  const windowMs = input.windowSeconds * 1000;
  const current = memoryBuckets.get(key);
  const resetAtMs =
    current && current.resetAtMs > now ? current.resetAtMs : now + windowMs;
  const count = current && current.resetAtMs > now ? current.count : 0;
  const nextCount = count + 1;

  memoryBuckets.set(key, { count: nextCount, resetAtMs });

  const resetAt = new Date(resetAtMs).toISOString();
  if (nextCount > input.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAtMs - now) / 1000));
    return { ok: false, retryAfterSeconds, resetAt };
  }

  return { ok: true, remaining: Math.max(0, input.limit - nextCount), resetAt };
}

export function createApiRateLimitStore(env: Env): ApiRateLimitStore {
  if (!env.DATABASE_URL || env.READ_MODELS_INLINE === "true") {
    return {
      consume: async (input) => consumeFromMemory(input),
    };
  }

  const db = createDb(env);

  return {
    consume: async (input) => {
      const now = new Date();
      const windowMs = input.windowSeconds * 1000;

      const rows = await db
        .select({
          bucket: apiRateLimits.bucket,
          count: apiRateLimits.count,
          resetAt: apiRateLimits.resetAt,
        })
        .from(apiRateLimits)
        .where(eq(apiRateLimits.bucket, input.bucket))
        .limit(1);
      const row = rows[0];

      const active = row && row.resetAt.getTime() > now.getTime();
      const nextResetAt = active
        ? row.resetAt
        : new Date(now.getTime() + windowMs);
      const nextCount = (active ? row.count : 0) + 1;

      await db
        .insert(apiRateLimits)
        .values({
          bucket: input.bucket,
          count: nextCount,
          resetAt: nextResetAt,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: apiRateLimits.bucket,
          set: { count: nextCount, resetAt: nextResetAt, updatedAt: now },
        });

      const resetAtIso = nextResetAt.toISOString();
      if (nextCount > input.limit) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((nextResetAt.getTime() - now.getTime()) / 1000),
        );
        return { ok: false, retryAfterSeconds, resetAt: resetAtIso };
      }
      return {
        ok: true,
        remaining: Math.max(0, input.limit - nextCount),
        resetAt: resetAtIso,
      };
    },
  };
}

export function getCommandRateLimitConfig(env: Env): {
  perIpPerMinute: number;
  perAddressPerMinute: number;
} {
  return {
    perIpPerMinute: envInt(env, "SIM_COMMAND_RATE_LIMIT_PER_MINUTE_IP") ?? 180,
    perAddressPerMinute:
      envInt(env, "SIM_COMMAND_RATE_LIMIT_PER_MINUTE_ADDRESS") ?? 60,
  };
}

export function clearApiRateLimitsForTests(): void {
  memoryBuckets.clear();
}
