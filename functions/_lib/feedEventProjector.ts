import { feedItemSchema, type FeedItemEventPayload } from "./eventSchemas.ts";

export type FeedEventRow = {
  seq: number;
  stage: string | null;
  payload: unknown;
};

export type FeedProjectPageInput = {
  stage?: string | null;
  beforeSeq?: number | null;
  limit: number;
};

export type FeedProjectPageOutput = {
  items: FeedItemEventPayload[];
  nextSeq?: number;
};

export function projectFeedPageFromEvents(
  rows: FeedEventRow[],
  input: FeedProjectPageInput,
): FeedProjectPageOutput {
  let filtered = [...rows];
  if (input.stage)
    filtered = filtered.filter((row) => row.stage === input.stage);

  const beforeSeq = input.beforeSeq;
  const hasBeforeSeq = beforeSeq !== undefined && beforeSeq !== null;
  if (hasBeforeSeq) {
    filtered = filtered.filter((row) => row.seq < Math.max(0, beforeSeq));
  }

  filtered.sort((a, b) => b.seq - a.seq);

  const pageRows = filtered.slice(0, input.limit + 1);
  const slice = pageRows.slice(0, input.limit);
  const items = slice.map((row) => feedItemSchema.parse(row.payload));
  const nextSeq =
    pageRows.length > input.limit ? pageRows[input.limit]?.seq : undefined;

  return nextSeq !== undefined ? { items, nextSeq } : { items };
}
