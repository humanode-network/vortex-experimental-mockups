import type { FeedItemDto } from "@/types/api";

import { feedItemsApi } from "./fixtures/feedApi.ts";

export type EventSeedEntry = {
  type: "feed.item.v1";
  stage: FeedItemDto["stage"];
  actorAddress: string | null;
  entityType: "feed";
  entityId: string;
  payload: FeedItemDto;
  createdAt: Date;
};

export function buildEventSeed(): EventSeedEntry[] {
  return [...feedItemsApi]
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )
    .map((item) => ({
      type: "feed.item.v1" as const,
      stage: item.stage,
      actorAddress: null,
      entityType: "feed" as const,
      entityId: item.id,
      payload: item,
      createdAt: new Date(item.timestamp),
    }));
}
