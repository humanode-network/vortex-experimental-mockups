import { z } from "zod";

export const toneSchema = z.enum(["ok", "warn"]);

export const feedStageSchema = z.enum([
  "pool",
  "vote",
  "build",
  "thread",
  "courts",
  "faction",
]);

export const feedStageDatumSchema = z.object({
  title: z.string(),
  description: z.string(),
  value: z.string(),
  tone: toneSchema.optional(),
});

export const feedStatSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const feedItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  meta: z.string(),
  stage: feedStageSchema,
  summaryPill: z.string(),
  summary: z.string(),
  stageData: z.array(feedStageDatumSchema).optional(),
  stats: z.array(feedStatSchema).optional(),
  proposer: z.string().optional(),
  proposerId: z.string().optional(),
  ctaPrimary: z.string().optional(),
  ctaSecondary: z.string().optional(),
  href: z.string().optional(),
  timestamp: z.string(),
});

export type FeedItemEventPayload = z.infer<typeof feedItemSchema>;
