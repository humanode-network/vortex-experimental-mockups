import { and, desc, eq, lt } from "drizzle-orm";

import { events } from "../../db/schema.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

export type AdminAuditAction =
  | "user.lock"
  | "user.unlock"
  | "writes.freeze"
  | "writes.unfreeze";

export type AdminAuditItem = {
  id: string;
  action: AdminAuditAction;
  targetAddress: string;
  lockedUntil?: string;
  reason?: string | null;
  timestamp: string;
};

type MemoryEntry = AdminAuditItem & { createdAtMs: number };

const memoryAudit: MemoryEntry[] = [];

function normalizeAddress(address: string): string {
  return address.trim();
}

export async function appendAdminAudit(
  env: Env,
  input: Omit<AdminAuditItem, "id" | "timestamp"> & {
    timestamp?: string;
  },
): Promise<AdminAuditItem> {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const targetAddress = normalizeAddress(input.targetAddress);
  const id = `admin:${input.action}:${targetAddress}:${timestamp}`;
  const item: AdminAuditItem = {
    id,
    action: input.action,
    targetAddress,
    ...(input.lockedUntil ? { lockedUntil: input.lockedUntil } : {}),
    ...(input.reason !== undefined ? { reason: input.reason } : {}),
    timestamp,
  };

  if (!env.DATABASE_URL) {
    memoryAudit.push({ ...item, createdAtMs: Date.now() });
    return item;
  }

  const db = createDb(env);
  await db.insert(events).values({
    type: "admin.action.v1",
    stage: null,
    actorAddress: null,
    entityType: "admin",
    entityId: id,
    payload: item,
    createdAt: new Date(timestamp),
  });

  return item;
}

export async function listAdminAudit(
  env: Env,
  input: { beforeSeq?: number | null; limit: number },
): Promise<{ items: AdminAuditItem[]; nextSeq?: number }> {
  if (!env.DATABASE_URL) {
    const sorted = [...memoryAudit].sort(
      (a, b) => b.createdAtMs - a.createdAtMs,
    );
    const page = sorted
      .slice(0, input.limit)
      .map(({ createdAtMs: _ms, ...rest }) => rest);
    return { items: page };
  }

  const db = createDb(env);
  const beforeSeq = input.beforeSeq;
  const hasBeforeSeq = beforeSeq !== undefined && beforeSeq !== null;
  const whereClause = hasBeforeSeq
    ? and(
        eq(events.type, "admin.action.v1"),
        lt(events.seq, Math.max(0, beforeSeq)),
      )
    : eq(events.type, "admin.action.v1");

  const ordered = await db
    .select({ seq: events.seq, payload: events.payload })
    .from(events)
    .where(whereClause)
    .orderBy(desc(events.seq))
    .limit(input.limit + 1);
  const slice = ordered.slice(0, input.limit);
  const items = slice.map((r) => r.payload as AdminAuditItem);
  const nextSeq =
    ordered.length > input.limit ? ordered[input.limit]?.seq : undefined;

  return nextSeq !== undefined ? { items, nextSeq } : { items };
}

export function clearAdminAuditForTests(): void {
  memoryAudit.length = 0;
}
