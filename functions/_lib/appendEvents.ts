import { events } from "../../db/schema.ts";
import { createDb } from "./db.ts";
import { feedItemSchema, type FeedItemEventPayload } from "./eventSchemas.ts";

type Env = Record<string, string | undefined>;

export async function appendFeedItemEvent(
  env: Env,
  input: {
    stage: FeedItemEventPayload["stage"];
    actorAddress?: string;
    entityType: string;
    entityId: string;
    payload: FeedItemEventPayload;
  },
): Promise<void> {
  if (!env.DATABASE_URL) return;
  const db = createDb(env);
  const payload = feedItemSchema.parse(input.payload);
  await db.insert(events).values({
    type: "feed.item.v1",
    stage: input.stage,
    actorAddress: input.actorAddress ?? null,
    entityType: input.entityType,
    entityId: input.entityId,
    payload,
    createdAt: new Date(payload.timestamp),
  });
}
