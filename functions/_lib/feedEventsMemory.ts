import type { FeedItemEventPayload } from "./eventSchemas.ts";

export type MemoryFeedEvent = {
  seq: number;
  stage: string | null;
  actorAddress: string | null;
  entityType: string;
  entityId: string;
  payload: FeedItemEventPayload;
};

let nextSeq = 1;
const memory: MemoryFeedEvent[] = [];

export function appendMemoryFeedEvent(
  input: Omit<MemoryFeedEvent, "seq">,
): void {
  memory.push({ ...input, seq: nextSeq++ });
}

export function listMemoryFeedEvents(): MemoryFeedEvent[] {
  return [...memory];
}

export function hasMemoryFeedEvent(input: {
  entityType: string;
  entityId: string;
}): boolean {
  return memory.some(
    (event) =>
      event.entityType === input.entityType &&
      event.entityId === input.entityId,
  );
}

export function clearMemoryFeedEventsForTests(): void {
  memory.length = 0;
  nextSeq = 1;
}
