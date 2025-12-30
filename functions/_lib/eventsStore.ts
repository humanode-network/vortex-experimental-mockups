import { and, desc, eq, lt } from "drizzle-orm";

import { events } from "../../db/schema.ts";
import { createDb } from "./db.ts";
import type { FeedItemEventPayload } from "./eventSchemas.ts";
import { projectFeedPageFromEvents } from "./feedEventProjector.ts";
import {
  clearMemoryFeedEventsForTests,
  listMemoryFeedEvents,
} from "./feedEventsMemory.ts";

type Env = Record<string, string | undefined>;

export type FeedEventsPage = {
  items: FeedItemEventPayload[];
  nextSeq?: number;
};

export async function listFeedEventsPage(
  env: Env,
  input: { stage?: string | null; beforeSeq?: number | null; limit: number },
): Promise<FeedEventsPage> {
  if (!env.DATABASE_URL) {
    const rows = listMemoryFeedEvents().map((event) => ({
      seq: event.seq,
      stage: event.stage,
      payload: event.payload,
    }));
    return projectFeedPageFromEvents(rows, input);
  }

  const db = createDb(env);

  const beforeSeq = input.beforeSeq;
  const hasBeforeSeq = beforeSeq !== undefined && beforeSeq !== null;

  const whereClause = and(
    eq(events.type, "feed.item.v1"),
    ...(input.stage ? [eq(events.stage, input.stage)] : []),
    ...(hasBeforeSeq ? [lt(events.seq, Math.max(0, beforeSeq))] : []),
  );

  const rows = await db
    .select({
      seq: events.seq,
      stage: events.stage,
      payload: events.payload,
    })
    .from(events)
    .where(whereClause)
    .orderBy(desc(events.seq))
    .limit(input.limit + 1);
  return projectFeedPageFromEvents(rows, input);
}

export function clearFeedEventsForTests(): void {
  clearMemoryFeedEventsForTests();
}
