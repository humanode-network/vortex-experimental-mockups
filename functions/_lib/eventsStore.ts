import { and, desc, eq, lt } from "drizzle-orm";

import { events } from "../../db/schema.ts";
import { createDb } from "./db.ts";
import type { FeedItemEventPayload } from "./eventSchemas.ts";
import { projectFeedPageFromEvents } from "./feedEventProjector.ts";

type Env = Record<string, string | undefined>;

export type FeedEventsPage = {
  items: FeedItemEventPayload[];
  nextSeq?: number;
};

export async function listFeedEventsPage(
  env: Env,
  input: { stage?: string | null; beforeSeq?: number | null; limit: number },
): Promise<FeedEventsPage> {
  const db = createDb(env);

  const conditions = [];
  conditions.push(eq(events.type, "feed.item.v1"));
  if (input.stage) conditions.push(eq(events.stage, input.stage));
  if (input.beforeSeq)
    conditions.push(lt(events.seq, Math.max(0, input.beforeSeq)));

  let query = db
    .select({
      seq: events.seq,
      stage: events.stage,
      payload: events.payload,
    })
    .from(events);
  if (conditions.length) {
    query = query.where(and(...conditions));
  }

  const rows = await query.orderBy(desc(events.seq)).limit(input.limit + 1);
  return projectFeedPageFromEvents(rows, input);
}
