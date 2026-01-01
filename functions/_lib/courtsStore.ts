import { and, eq, sql } from "drizzle-orm";

import { courtCases, courtReports, courtVerdicts } from "../../db/schema.ts";
import type { ReadModelsStore } from "./readModelsStore.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

export type CourtStatus = "jury" | "live" | "ended";
export type CourtVerdict = "guilty" | "not_guilty";

type CourtCaseSeed = {
  status: CourtStatus;
  baseReports: number;
  opened: string | null;
};

export type CourtOverlay = {
  status: CourtStatus;
  reports: number;
  verdicts: { guilty: number; notGuilty: number };
};

const REPORTS_TO_START_LIVE = 12;
const VERDICTS_TO_END = 12;

const memoryCases = new Map<string, CourtCaseSeed>();
const memoryReports = new Map<string, Set<string>>();
const memoryVerdicts = new Map<string, Map<string, CourtVerdict>>();

export async function hasCourtReport(
  env: Env,
  input: { caseId: string; reporterAddress: string },
): Promise<boolean> {
  const reporter = input.reporterAddress.trim();
  if (!env.DATABASE_URL) {
    const set = memoryReports.get(input.caseId);
    if (!set) return false;
    return set.has(reporter);
  }
  const db = createDb(env);
  const existing = await db
    .select({ reporterAddress: courtReports.reporterAddress })
    .from(courtReports)
    .where(
      and(
        eq(courtReports.caseId, input.caseId),
        eq(courtReports.reporterAddress, reporter),
      ),
    )
    .limit(1);
  return existing.length > 0;
}

export async function hasCourtVerdict(
  env: Env,
  input: { caseId: string; voterAddress: string },
): Promise<boolean> {
  const voter = input.voterAddress.trim();
  if (!env.DATABASE_URL) {
    const map = memoryVerdicts.get(input.caseId);
    if (!map) return false;
    return map.has(voter);
  }
  const db = createDb(env);
  const existing = await db
    .select({ voterAddress: courtVerdicts.voterAddress })
    .from(courtVerdicts)
    .where(
      and(
        eq(courtVerdicts.caseId, input.caseId),
        eq(courtVerdicts.voterAddress, voter),
      ),
    )
    .limit(1);
  return existing.length > 0;
}

export async function ensureCourtCaseSeed(
  env: Env,
  readModels: ReadModelsStore,
  caseId: string,
): Promise<CourtCaseSeed> {
  if (!env.DATABASE_URL) {
    const existing = memoryCases.get(caseId);
    if (existing) return existing;
    const seed = await seedFromReadModel(readModels, caseId);
    memoryCases.set(caseId, seed);
    if (!memoryReports.has(caseId)) memoryReports.set(caseId, new Set());
    if (!memoryVerdicts.has(caseId)) memoryVerdicts.set(caseId, new Map());
    return seed;
  }

  const db = createDb(env);
  const existing = await db
    .select()
    .from(courtCases)
    .where(eq(courtCases.id, caseId))
    .limit(1);
  if (existing[0]) {
    return {
      status: normalizeStatus(existing[0].status),
      baseReports: existing[0].baseReports,
      opened: existing[0].opened ?? null,
    };
  }

  const seed = await seedFromReadModel(readModels, caseId);
  const now = new Date();
  await db.insert(courtCases).values({
    id: caseId,
    status: seed.status,
    baseReports: seed.baseReports,
    opened: seed.opened,
    createdAt: now,
    updatedAt: now,
  });
  return seed;
}

export async function getCourtOverlay(
  env: Env,
  readModels: ReadModelsStore,
  caseId: string,
): Promise<CourtOverlay> {
  const seed = await ensureCourtCaseSeed(env, readModels, caseId);

  if (!env.DATABASE_URL) {
    const reports = (memoryReports.get(caseId)?.size ?? 0) + seed.baseReports;
    const verdictMap = memoryVerdicts.get(caseId) ?? new Map();
    const guilty = Array.from(verdictMap.values()).filter(
      (v) => v === "guilty",
    ).length;
    const notGuilty = Array.from(verdictMap.values()).filter(
      (v) => v === "not_guilty",
    ).length;
    const status = computeStatus(seed.status, reports, guilty + notGuilty);
    return {
      status,
      reports,
      verdicts: { guilty, notGuilty },
    };
  }

  const db = createDb(env);
  const [reportAgg] = await db
    .select({ n: sql<number>`count(*)` })
    .from(courtReports)
    .where(eq(courtReports.caseId, caseId));
  const [guiltyAgg] = await db
    .select({
      n: sql<number>`sum(case when ${courtVerdicts.verdict} = 'guilty' then 1 else 0 end)`,
    })
    .from(courtVerdicts)
    .where(eq(courtVerdicts.caseId, caseId));
  const [notGuiltyAgg] = await db
    .select({
      n: sql<number>`sum(case when ${courtVerdicts.verdict} = 'not_guilty' then 1 else 0 end)`,
    })
    .from(courtVerdicts)
    .where(eq(courtVerdicts.caseId, caseId));

  const reports = seed.baseReports + Number(reportAgg?.n ?? 0);
  const guilty = Number(guiltyAgg?.n ?? 0);
  const notGuilty = Number(notGuiltyAgg?.n ?? 0);
  const status = computeStatus(seed.status, reports, guilty + notGuilty);

  if (status !== seed.status) {
    await db
      .update(courtCases)
      .set({ status, updatedAt: new Date() })
      .where(eq(courtCases.id, caseId));
  }

  return {
    status,
    reports,
    verdicts: { guilty, notGuilty },
  };
}

export async function reportCourtCase(
  env: Env,
  readModels: ReadModelsStore,
  input: { caseId: string; reporterAddress: string },
): Promise<{ overlay: CourtOverlay; created: boolean }> {
  await ensureCourtCaseSeed(env, readModels, input.caseId);

  const reporter = input.reporterAddress.trim();
  if (!env.DATABASE_URL) {
    const set = memoryReports.get(input.caseId) ?? new Set<string>();
    const created = !set.has(reporter);
    set.add(reporter);
    memoryReports.set(input.caseId, set);
    return {
      overlay: await getCourtOverlay(env, readModels, input.caseId),
      created,
    };
  }

  const db = createDb(env);
  const existing = await db
    .select({ reporterAddress: courtReports.reporterAddress })
    .from(courtReports)
    .where(
      and(
        eq(courtReports.caseId, input.caseId),
        eq(courtReports.reporterAddress, reporter),
      ),
    )
    .limit(1);
  const created = existing.length === 0;
  await db
    .insert(courtReports)
    .values({
      caseId: input.caseId,
      reporterAddress: reporter,
      createdAt: new Date(),
    })
    .onConflictDoNothing({
      target: [courtReports.caseId, courtReports.reporterAddress],
    });

  return {
    overlay: await getCourtOverlay(env, readModels, input.caseId),
    created,
  };
}

export async function castCourtVerdict(
  env: Env,
  readModels: ReadModelsStore,
  input: { caseId: string; voterAddress: string; verdict: CourtVerdict },
): Promise<{ overlay: CourtOverlay; created: boolean }> {
  const overlay = await getCourtOverlay(env, readModels, input.caseId);
  if (overlay.status !== "live") throw new Error("case_not_live");

  const voter = input.voterAddress.trim();
  if (!env.DATABASE_URL) {
    const map =
      memoryVerdicts.get(input.caseId) ?? new Map<string, CourtVerdict>();
    const created = !map.has(voter);
    map.set(voter, input.verdict);
    memoryVerdicts.set(input.caseId, map);
    return {
      overlay: await getCourtOverlay(env, readModels, input.caseId),
      created,
    };
  }

  const db = createDb(env);
  const existing = await db
    .select({ voterAddress: courtVerdicts.voterAddress })
    .from(courtVerdicts)
    .where(
      and(
        eq(courtVerdicts.caseId, input.caseId),
        eq(courtVerdicts.voterAddress, voter),
      ),
    )
    .limit(1);
  const created = existing.length === 0;
  const now = new Date();
  await db
    .insert(courtVerdicts)
    .values({
      caseId: input.caseId,
      voterAddress: voter,
      verdict: input.verdict,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [courtVerdicts.caseId, courtVerdicts.voterAddress],
      set: { verdict: input.verdict, updatedAt: now },
    });

  return {
    overlay: await getCourtOverlay(env, readModels, input.caseId),
    created,
  };
}

export function clearCourtsForTests() {
  memoryCases.clear();
  memoryReports.clear();
  memoryVerdicts.clear();
}

async function seedFromReadModel(
  readModels: ReadModelsStore,
  caseId: string,
): Promise<CourtCaseSeed> {
  const payload = await readModels.get(`courts:${caseId}`);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("court_case_missing");
  }
  const record = payload as Record<string, unknown>;
  const status = normalizeStatus(record.status);
  const reports = typeof record.reports === "number" ? record.reports : 0;
  const opened = typeof record.opened === "string" ? record.opened : null;
  return { status, baseReports: reports, opened };
}

function normalizeStatus(value: unknown): CourtStatus {
  if (value === "jury" || value === "live" || value === "ended") return value;
  return "jury";
}

function computeStatus(
  base: CourtStatus,
  reports: number,
  verdicts: number,
): CourtStatus {
  if (base === "ended") return "ended";
  const effectiveStage: "jury" | "live" =
    base === "live" || reports >= REPORTS_TO_START_LIVE ? "live" : "jury";
  if (effectiveStage === "jury") return "jury";
  if (verdicts >= VERDICTS_TO_END) return "ended";
  return "live";
}
