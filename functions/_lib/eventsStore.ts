import { and, desc, eq, lt } from "drizzle-orm";

import { events } from "../../db/schema.ts";
import { createDb } from "./db.ts";
import { feedItemSchema, type FeedItemEventPayload } from "./eventSchemas.ts";

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
  if (input.stage) conditions.push(eq(events.stage, input.stage));
  if (input.beforeSeq)
    conditions.push(lt(events.seq, Math.max(0, input.beforeSeq)));

  let query = db
    .select({
      seq: events.seq,
      payload: events.payload,
    })
    .from(events);
  if (conditions.length) {
    query = query.where(and(...conditions));
  }

  const rows = await query.orderBy(desc(events.seq)).limit(input.limit + 1);

  const slice = rows.slice(0, input.limit);
  const parsed = slice.map((row) => feedItemSchema.parse(row.payload));
  const nextSeq =
    rows.length > input.limit ? rows[input.limit]?.seq : undefined;

  return nextSeq !== undefined ? { items: parsed, nextSeq } : { items: parsed };
}
