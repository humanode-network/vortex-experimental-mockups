import { and, asc, eq } from "drizzle-orm";

import { events } from "../../db/schema.ts";
import type { ProposalTimelineItemDto } from "../../src/types/api.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

const EVENT_TYPE = "proposal.timeline.v1";
const ENTITY_TYPE = "proposal";

const memory = new Map<string, ProposalTimelineItemDto[]>();

export async function appendProposalTimelineItem(
  env: Env,
  input: {
    proposalId: string;
    stage?: string | null;
    actorAddress?: string | null;
    item: ProposalTimelineItemDto;
  },
): Promise<void> {
  if (!env.DATABASE_URL) {
    const items = memory.get(input.proposalId) ?? [];
    memory.set(input.proposalId, [...items, input.item]);
    return;
  }

  const db = createDb(env);
  await db.insert(events).values({
    type: EVENT_TYPE,
    stage: input.stage ?? null,
    actorAddress: input.actorAddress ?? null,
    entityType: ENTITY_TYPE,
    entityId: input.proposalId,
    payload: input.item,
    createdAt: new Date(input.item.timestamp),
  });
}

export async function listProposalTimelineItems(
  env: Env,
  input: { proposalId: string; limit: number },
): Promise<ProposalTimelineItemDto[]> {
  if (!env.DATABASE_URL) {
    const items = memory.get(input.proposalId) ?? [];
    return [...items]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .slice(-input.limit);
  }

  const db = createDb(env);
  const rows = await db
    .select({ seq: events.seq, payload: events.payload })
    .from(events)
    .where(
      and(
        eq(events.type, EVENT_TYPE),
        eq(events.entityType, ENTITY_TYPE),
        eq(events.entityId, input.proposalId),
      ),
    )
    .orderBy(asc(events.seq))
    .limit(Math.max(1, input.limit));

  return rows.map((row) => row.payload as ProposalTimelineItemDto);
}

export function clearProposalTimelineForTests(): void {
  memory.clear();
}
