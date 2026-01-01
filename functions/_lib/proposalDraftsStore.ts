import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { proposalDrafts } from "../../db/schema.ts";
import { randomHex } from "./random.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

export const proposalDraftFormSchema = z.object({
  title: z.string(),
  chamberId: z.string(),
  summary: z.string(),
  what: z.string(),
  why: z.string(),
  how: z.string(),
  metaGovernance: z
    .object({
      action: z.enum(["chamber.create", "chamber.dissolve"]),
      chamberId: z.string(),
      title: z.string().optional(),
      multiplier: z.number().optional(),
      genesisMembers: z.array(z.string()).optional(),
    })
    .optional(),
  timeline: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      timeframe: z.string(),
    }),
  ),
  outputs: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      url: z.string(),
    }),
  ),
  budgetItems: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      amount: z.string(),
    }),
  ),
  aboutMe: z.string(),
  attachments: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      url: z.string(),
    }),
  ),
  agreeRules: z.boolean(),
  confirmBudget: z.boolean(),
});

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

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function computeBudgetTotalHmnd(form: ProposalDraftForm): number {
  return form.budgetItems.reduce((sum, item) => {
    const n = Number(item.amount);
    if (!Number.isFinite(n) || n <= 0) return sum;
    return sum + n;
  }, 0);
}

export function draftIsSubmittable(form: ProposalDraftForm): boolean {
  const budgetTotal = computeBudgetTotalHmnd(form);
  const essentialsValid =
    form.title.trim().length > 0 &&
    form.what.trim().length > 0 &&
    form.why.trim().length > 0;
  const planValid = form.how.trim().length > 0;
  const budgetValid = form.metaGovernance
    ? true
    : form.budgetItems.some(
        (item) =>
          item.description.trim().length > 0 &&
          Number.isFinite(Number(item.amount)) &&
          Number(item.amount) > 0,
      ) && budgetTotal > 0;
  const rulesValid = form.agreeRules && form.confirmBudget;
  return essentialsValid && planValid && budgetValid && rulesValid;
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

  const id =
    typeof input.draftId === "string" && input.draftId.trim().length > 0
      ? input.draftId.trim()
      : formatDraftId({ title: input.form.title });

  if (!env.DATABASE_URL) {
    const byId =
      memoryDraftsByAuthor.get(address) ??
      new Map<string, ProposalDraftRecord>();
    const existing = byId.get(id);
    const record: ProposalDraftRecord = {
      id,
      authorAddress: address,
      title: input.form.title,
      chamberId: input.form.chamberId || null,
      summary: input.form.summary,
      payload: input.form,
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
      title: input.form.title,
      chamberId: input.form.chamberId || null,
      summary: input.form.summary,
      payload: input.form,
      submittedAt,
      submittedProposalId,
      createdAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: proposalDrafts.id,
      set: {
        title: input.form.title,
        chamberId: input.form.chamberId || null,
        summary: input.form.summary,
        payload: input.form,
        updatedAt: now,
      },
    });

  return {
    id,
    authorAddress: address,
    title: input.form.title,
    chamberId: input.form.chamberId || null,
    summary: input.form.summary,
    payload: input.form,
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
    return list
      .filter((d) => includeSubmitted || !d.submittedAt)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
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

  return rows.map((row) => ({
    id: row.id,
    authorAddress: row.authorAddress,
    title: row.title,
    chamberId: row.chamberId ?? null,
    summary: row.summary,
    payload: proposalDraftFormSchema.parse(row.payload),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    submittedAt: row.submittedAt ?? null,
    submittedProposalId: row.submittedProposalId ?? null,
  }));
}

export async function getDraft(
  env: Env,
  input: { authorAddress: string; draftId: string },
): Promise<ProposalDraftRecord | null> {
  const address = input.authorAddress.trim();
  const id = input.draftId.trim();
  if (!env.DATABASE_URL) {
    const byId = memoryDraftsByAuthor.get(address);
    return byId?.get(id) ?? null;
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
  return {
    id: row.id,
    authorAddress: row.authorAddress,
    title: row.title,
    chamberId: row.chamberId ?? null,
    summary: row.summary,
    payload: proposalDraftFormSchema.parse(row.payload),
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
