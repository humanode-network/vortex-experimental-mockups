import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { proposalDrafts } from "../../db/schema.ts";
import { randomHex } from "./random.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

const timelineItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  timeframe: z.string(),
});

const outputItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
});

const budgetItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  amount: z.string(),
});

const attachmentItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
});

const metaGovernanceSchema = z.object({
  action: z.enum(["chamber.create", "chamber.dissolve"]),
  chamberId: z.string(),
  title: z.string().optional(),
  multiplier: z.number().optional(),
  genesisMembers: z.array(z.string()).optional(),
});

const optionalString = z.string().optional().default("");
const optionalTimeline = z.array(timelineItemSchema).optional().default([]);
const optionalOutputs = z.array(outputItemSchema).optional().default([]);
const optionalBudgetItems = z.array(budgetItemSchema).optional().default([]);
const optionalAttachments = z
  .array(attachmentItemSchema)
  .optional()
  .default([]);

const projectDraftSchema = z.object({
  templateId: z.literal("project"),
  title: z.string(),
  chamberId: z.string(),
  summary: z.string(),
  what: z.string(),
  why: z.string(),
  how: z.string(),
  metaGovernance: z.undefined().optional(),
  timeline: z.array(timelineItemSchema),
  outputs: z.array(outputItemSchema),
  budgetItems: z.array(budgetItemSchema),
  aboutMe: z.string(),
  attachments: z.array(attachmentItemSchema),
  agreeRules: z.boolean(),
  confirmBudget: z.boolean(),
});

const systemDraftSchema = z.object({
  templateId: z.literal("system"),
  title: z.string(),
  chamberId: z.string(),
  summary: optionalString,
  what: optionalString,
  why: optionalString,
  how: optionalString,
  metaGovernance: metaGovernanceSchema,
  timeline: optionalTimeline,
  outputs: optionalOutputs,
  budgetItems: optionalBudgetItems,
  aboutMe: optionalString,
  attachments: optionalAttachments,
  agreeRules: z.boolean(),
  confirmBudget: z.boolean(),
});

export const proposalDraftFormSchema = z.preprocess(
  (input) => {
    if (!input || typeof input !== "object" || Array.isArray(input))
      return input;
    const record = { ...(input as Record<string, unknown>) };
    if (!("templateId" in record)) {
      record.templateId = record.metaGovernance ? "system" : "project";
    }
    return record;
  },
  z.discriminatedUnion("templateId", [projectDraftSchema, systemDraftSchema]),
);

export type ProposalDraftForm = z.infer<typeof proposalDraftFormSchema>;

export type ProposalDraftRecord = {
  id: string;
  authorAddress: string;
  title: string;
  chamberId: string | null;
  summary: string;
  payload: ProposalDraftForm;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
  submittedProposalId: string | null;
};

const memoryDraftsByAuthor = new Map<
  string,
  Map<string, ProposalDraftRecord>
>();

export function clearProposalDraftsForTests() {
  memoryDraftsByAuthor.clear();
}

export function seedLegacyDraftForTests(input: {
  authorAddress: string;
  draftId: string;
  title: string;
  chamberId?: string | null;
  summary?: string;
  payload: unknown;
  createdAt?: Date;
  updatedAt?: Date;
  submittedAt?: Date | null;
  submittedProposalId?: string | null;
}) {
  const address = input.authorAddress.trim();
  const now = new Date();
  const byId =
    memoryDraftsByAuthor.get(address) ?? new Map<string, ProposalDraftRecord>();
  const record: ProposalDraftRecord = {
    id: input.draftId,
    authorAddress: address,
    title: input.title,
    chamberId: input.chamberId ?? null,
    summary: input.summary ?? "",
    payload: input.payload as ProposalDraftForm,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    submittedAt: input.submittedAt ?? null,
    submittedProposalId: input.submittedProposalId ?? null,
  };
  byId.set(record.id, record);
  memoryDraftsByAuthor.set(address, byId);
}

function hasTemplateId(payload: unknown): boolean {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return false;
  return typeof (payload as { templateId?: unknown }).templateId === "string";
}

function normalizeDraftPayload(payload: unknown): ProposalDraftForm {
  return proposalDraftFormSchema.parse(payload);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function computeBudgetTotalHmnd(form: ProposalDraftForm): number {
  return (form.budgetItems ?? []).reduce((sum, item) => {
    const n = Number(item.amount);
    if (!Number.isFinite(n) || n <= 0) return sum;
    return sum + n;
  }, 0);
}

function resolveTemplateId(form: ProposalDraftForm): "project" | "system" {
  return form.templateId;
}

export function draftIsSubmittable(form: ProposalDraftForm): boolean {
  const templateId = resolveTemplateId(form);
  const isSystem = templateId === "system";
  const budgetTotal = computeBudgetTotalHmnd(form);
  const title = (form.title ?? "").trim();
  const what = (form.what ?? "").trim();
  const why = (form.why ?? "").trim();
  const how = (form.how ?? "").trim();
  const essentialsValid =
    title.length > 0 && (isSystem ? true : what.length > 0 && why.length > 0);
  const planValid = isSystem ? true : how.length > 0;
  const budgetItems = form.budgetItems ?? [];
  const budgetValid = isSystem
    ? true
    : budgetItems.some(
        (item) =>
          item.description.trim().length > 0 &&
          Number.isFinite(Number(item.amount)) &&
          Number(item.amount) > 0,
      ) && budgetTotal > 0;
  const meta = form.metaGovernance;
  const systemValid = isSystem
    ? Boolean(
        meta &&
          (form.chamberId ?? "").trim().toLowerCase() === "general" &&
          meta.chamberId.trim().length > 0 &&
          (meta.action === "chamber.dissolve"
            ? true
            : (meta.title ?? "").trim().length > 0),
      )
    : true;
  const rulesValid = form.agreeRules && form.confirmBudget;
  return (
    essentialsValid && planValid && budgetValid && systemValid && rulesValid
  );
}

export function formatChamberLabel(chamberId: string | null): string {
  const id = (chamberId ?? "").trim();
  if (!id) return "General chamber";
  const title = id
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
  return `${title} chamber`;
}

export function formatDraftId(input: { title: string }): string {
  const slug = slugify(input.title);
  const suffix = randomHex(2);
  return `draft-${slug || "untitled"}-${suffix}`;
}

export async function upsertDraft(
  env: Env,
  input: { authorAddress: string; draftId?: string; form: ProposalDraftForm },
): Promise<ProposalDraftRecord> {
  const address = input.authorAddress.trim();
  const now = new Date();
  const form = proposalDraftFormSchema.parse(input.form);

  const id =
    typeof input.draftId === "string" && input.draftId.trim().length > 0
      ? input.draftId.trim()
      : formatDraftId({ title: form.title });

  if (!env.DATABASE_URL) {
    const byId =
      memoryDraftsByAuthor.get(address) ??
      new Map<string, ProposalDraftRecord>();
    const existing = byId.get(id);
    const record: ProposalDraftRecord = {
      id,
      authorAddress: address,
      title: form.title,
      chamberId: form.chamberId || null,
      summary: form.summary,
      payload: form,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      submittedAt: existing?.submittedAt ?? null,
      submittedProposalId: existing?.submittedProposalId ?? null,
    };
    byId.set(id, record);
    memoryDraftsByAuthor.set(address, byId);
    return record;
  }

  const db = createDb(env);
  const existing = await db
    .select({
      id: proposalDrafts.id,
      createdAt: proposalDrafts.createdAt,
      submittedAt: proposalDrafts.submittedAt,
      submittedProposalId: proposalDrafts.submittedProposalId,
    })
    .from(proposalDrafts)
    .where(
      and(eq(proposalDrafts.id, id), eq(proposalDrafts.authorAddress, address)),
    )
    .limit(1);

  const createdAt = existing[0]?.createdAt ?? now;
  const submittedAt = existing[0]?.submittedAt ?? null;
  const submittedProposalId = existing[0]?.submittedProposalId ?? null;

  await db
    .insert(proposalDrafts)
    .values({
      id,
      authorAddress: address,
      title: form.title,
      chamberId: form.chamberId || null,
      summary: form.summary,
      payload: form,
      submittedAt,
      submittedProposalId,
      createdAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: proposalDrafts.id,
      set: {
        title: form.title,
        chamberId: form.chamberId || null,
        summary: form.summary,
        payload: form,
        updatedAt: now,
      },
    });

  return {
    id,
    authorAddress: address,
    title: form.title,
    chamberId: form.chamberId || null,
    summary: form.summary,
    payload: form,
    createdAt,
    updatedAt: now,
    submittedAt,
    submittedProposalId,
  };
}

export async function deleteDraft(
  env: Env,
  input: { authorAddress: string; draftId: string },
): Promise<boolean> {
  const address = input.authorAddress.trim();
  const id = input.draftId.trim();
  if (!env.DATABASE_URL) {
    const byId = memoryDraftsByAuthor.get(address);
    if (!byId) return false;
    return byId.delete(id);
  }

  const db = createDb(env);
  const res = await db
    .delete(proposalDrafts)
    .where(
      and(eq(proposalDrafts.id, id), eq(proposalDrafts.authorAddress, address)),
    );
  return res.rowCount > 0;
}

export async function listDrafts(
  env: Env,
  input: { authorAddress: string; includeSubmitted?: boolean },
): Promise<ProposalDraftRecord[]> {
  const address = input.authorAddress.trim();
  const includeSubmitted = Boolean(input.includeSubmitted);

  if (!env.DATABASE_URL) {
    const byId = memoryDraftsByAuthor.get(address);
    const list = byId ? Array.from(byId.values()) : [];
    const normalized = list
      .filter((d) => includeSubmitted || !d.submittedAt)
      .map((draft) => {
        if (!hasTemplateId(draft.payload)) {
          const payload = normalizeDraftPayload(draft.payload);
          const next = { ...draft, payload };
          byId?.set(draft.id, next);
          return next;
        }
        return draft;
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return normalized;
  }

  const db = createDb(env);
  const where = includeSubmitted
    ? and(eq(proposalDrafts.authorAddress, address))
    : and(
        eq(proposalDrafts.authorAddress, address),
        isNull(proposalDrafts.submittedAt),
      );

  const rows = await db
    .select({
      id: proposalDrafts.id,
      authorAddress: proposalDrafts.authorAddress,
      title: proposalDrafts.title,
      chamberId: proposalDrafts.chamberId,
      summary: proposalDrafts.summary,
      payload: proposalDrafts.payload,
      createdAt: proposalDrafts.createdAt,
      updatedAt: proposalDrafts.updatedAt,
      submittedAt: proposalDrafts.submittedAt,
      submittedProposalId: proposalDrafts.submittedProposalId,
    })
    .from(proposalDrafts)
    .where(where)
    .orderBy(desc(proposalDrafts.updatedAt));

  const migrations: Promise<unknown>[] = [];
  const result = rows.map((row) => {
    const needsMigration = !hasTemplateId(row.payload);
    const payload = normalizeDraftPayload(row.payload);
    if (needsMigration) {
      migrations.push(
        db
          .update(proposalDrafts)
          .set({ payload, updatedAt: row.updatedAt })
          .where(
            and(
              eq(proposalDrafts.id, row.id),
              eq(proposalDrafts.authorAddress, row.authorAddress),
            ),
          ),
      );
    }
    return {
      id: row.id,
      authorAddress: row.authorAddress,
      title: row.title,
      chamberId: row.chamberId ?? null,
      summary: row.summary,
      payload,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      submittedAt: row.submittedAt ?? null,
      submittedProposalId: row.submittedProposalId ?? null,
    };
  });
  if (migrations.length > 0) {
    await Promise.all(migrations);
  }
  return result;
}

export async function getDraft(
  env: Env,
  input: { authorAddress: string; draftId: string },
): Promise<ProposalDraftRecord | null> {
  const address = input.authorAddress.trim();
  const id = input.draftId.trim();
  if (!env.DATABASE_URL) {
    const byId = memoryDraftsByAuthor.get(address);
    const record = byId?.get(id) ?? null;
    if (!record) return null;
    if (!hasTemplateId(record.payload)) {
      const payload = normalizeDraftPayload(record.payload);
      const next = { ...record, payload };
      byId?.set(id, next);
      return next;
    }
    return record;
  }

  const db = createDb(env);
  const rows = await db
    .select({
      id: proposalDrafts.id,
      authorAddress: proposalDrafts.authorAddress,
      title: proposalDrafts.title,
      chamberId: proposalDrafts.chamberId,
      summary: proposalDrafts.summary,
      payload: proposalDrafts.payload,
      createdAt: proposalDrafts.createdAt,
      updatedAt: proposalDrafts.updatedAt,
      submittedAt: proposalDrafts.submittedAt,
      submittedProposalId: proposalDrafts.submittedProposalId,
    })
    .from(proposalDrafts)
    .where(
      and(eq(proposalDrafts.id, id), eq(proposalDrafts.authorAddress, address)),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const needsMigration = !hasTemplateId(row.payload);
  const payload = normalizeDraftPayload(row.payload);
  if (needsMigration) {
    await db
      .update(proposalDrafts)
      .set({ payload, updatedAt: row.updatedAt })
      .where(
        and(
          eq(proposalDrafts.id, row.id),
          eq(proposalDrafts.authorAddress, row.authorAddress),
        ),
      );
  }
  return {
    id: row.id,
    authorAddress: row.authorAddress,
    title: row.title,
    chamberId: row.chamberId ?? null,
    summary: row.summary,
    payload,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    submittedAt: row.submittedAt ?? null,
    submittedProposalId: row.submittedProposalId ?? null,
  };
}

export async function markDraftSubmitted(
  env: Env,
  input: { authorAddress: string; draftId: string; proposalId: string },
): Promise<void> {
  const address = input.authorAddress.trim();
  const draftId = input.draftId.trim();
  const now = new Date();

  if (!env.DATABASE_URL) {
    const byId = memoryDraftsByAuthor.get(address);
    const existing = byId?.get(draftId);
    if (!existing) throw new Error("draft_missing");
    byId?.set(draftId, {
      ...existing,
      submittedAt: existing.submittedAt ?? now,
      submittedProposalId: existing.submittedProposalId ?? input.proposalId,
      updatedAt: now,
    });
    return;
  }

  const db = createDb(env);
  await db
    .update(proposalDrafts)
    .set({
      submittedAt: now,
      submittedProposalId: input.proposalId,
      updatedAt: now,
    })
    .where(
      and(
        eq(proposalDrafts.id, draftId),
        eq(proposalDrafts.authorAddress, address),
      ),
    );
}
