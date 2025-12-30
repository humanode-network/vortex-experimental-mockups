import { and, eq } from "drizzle-orm";

import { events } from "../../db/schema.ts";
import { createDb } from "./db.ts";
import { feedItemSchema, type FeedItemEventPayload } from "./eventSchemas.ts";
import {
  appendMemoryFeedEvent,
  hasMemoryFeedEvent,
} from "./feedEventsMemory.ts";

type Env = Record<string, string | undefined>;

export async function feedItemEventExists(
  env: Env,
  input: { entityType: string; entityId: string },
): Promise<boolean> {
  if (!env.DATABASE_URL) {
    return hasMemoryFeedEvent(input);
  }

  const db = createDb(env);
  const rows = await db
    .select({ seq: events.seq })
    .from(events)
    .where(
      and(
        eq(events.type, "feed.item.v1"),
        eq(events.entityType, input.entityType),
        eq(events.entityId, input.entityId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

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
  const payload = feedItemSchema.parse(input.payload);

  if (!env.DATABASE_URL) {
    appendMemoryFeedEvent({
      stage: input.stage,
      actorAddress: input.actorAddress ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      payload,
    });
    return;
  }

  const db = createDb(env);
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

export async function appendFeedItemEventOnce(
  env: Env,
  input: Parameters<typeof appendFeedItemEvent>[1],
): Promise<boolean> {
  const exists = await feedItemEventExists(env, {
    entityType: input.entityType,
    entityId: input.entityId,
  });
  if (exists) return false;
  await appendFeedItemEvent(env, input);
  return true;
}
