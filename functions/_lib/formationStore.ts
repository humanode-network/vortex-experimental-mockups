import { and, eq, sql } from "drizzle-orm";

import {
  formationMilestoneEvents,
  formationMilestones,
  formationProjects,
  formationTeam,
} from "../../db/schema.ts";
import type { ReadModelsStore } from "./readModelsStore.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

type FormationProjectSeed = {
  teamSlotsTotal: number;
  baseTeamFilled: number;
  milestonesTotal: number;
  baseMilestonesCompleted: number;
  budgetTotalHmnd: number | null;
  baseBudgetAllocatedHmnd: number | null;
};

type FormationMilestoneStatus = "todo" | "submitted" | "unlocked";

type FormationSummary = {
  teamFilled: number;
  teamTotal: number;
  milestonesCompleted: number;
  milestonesTotal: number;
};

const memoryProjects = new Map<string, FormationProjectSeed>();
const memoryTeam = new Map<string, Map<string, { role?: string | null }>>();
const memoryMilestones = new Map<
  string,
  Map<number, FormationMilestoneStatus>
>();

export type FormationSeedInput = FormationProjectSeed;

export async function isFormationTeamMember(
  env: Env,
  input: { proposalId: string; memberAddress: string },
): Promise<boolean> {
  const address = input.memberAddress.trim();
  if (!env.DATABASE_URL) {
    const team = memoryTeam.get(input.proposalId);
    if (!team) return false;
    return team.has(address);
  }
  const db = createDb(env);
  const existing = await db
    .select({ memberAddress: formationTeam.memberAddress })
    .from(formationTeam)
    .where(
      and(
        eq(formationTeam.proposalId, input.proposalId),
        eq(formationTeam.memberAddress, address),
      ),
    )
    .limit(1);
  return existing.length > 0;
}

export async function getFormationMilestoneStatus(
  env: Env,
  readModels: ReadModelsStore,
  input: { proposalId: string; milestoneIndex: number },
): Promise<FormationMilestoneStatus> {
  const seed = await ensureFormationSeed(env, readModels, input.proposalId);
  if (input.milestoneIndex < 1 || input.milestoneIndex > seed.milestonesTotal) {
    throw new Error("milestone_out_of_range");
  }

  if (!env.DATABASE_URL) {
    const milestones = memoryMilestones.get(input.proposalId);
    if (!milestones) throw new Error("milestones_missing");
    return milestones.get(input.milestoneIndex) ?? "todo";
  }

  const db = createDb(env);
  const rows = await db
    .select({ status: formationMilestones.status })
    .from(formationMilestones)
    .where(
      and(
        eq(formationMilestones.proposalId, input.proposalId),
        eq(formationMilestones.milestoneIndex, input.milestoneIndex),
      ),
    )
    .limit(1);
  const current = rows[0]?.status;
  if (current === "submitted" || current === "unlocked" || current === "todo") {
    return current;
  }
  return "todo";
}

export async function ensureFormationSeed(
  env: Env,
  readModels: ReadModelsStore,
  proposalId: string,
): Promise<FormationProjectSeed> {
  if (!env.DATABASE_URL) {
    const existing = memoryProjects.get(proposalId);
    if (existing) return existing;
    const seed = await buildSeedFromReadModel(readModels, proposalId);
    memoryProjects.set(proposalId, seed);
    const milestoneMap = new Map<number, FormationMilestoneStatus>();
    for (let i = 1; i <= seed.milestonesTotal; i += 1) {
      milestoneMap.set(
        i,
        i <= seed.baseMilestonesCompleted ? "unlocked" : "todo",
      );
    }
    memoryMilestones.set(proposalId, milestoneMap);
    if (!memoryTeam.has(proposalId)) memoryTeam.set(proposalId, new Map());
    return seed;
  }

  const db = createDb(env);
  const existing = await db
    .select()
    .from(formationProjects)
    .where(eq(formationProjects.proposalId, proposalId))
    .limit(1);
  if (existing[0]) {
    return {
      teamSlotsTotal: existing[0].teamSlotsTotal,
      baseTeamFilled: existing[0].baseTeamFilled,
      milestonesTotal: existing[0].milestonesTotal,
      baseMilestonesCompleted: existing[0].baseMilestonesCompleted,
      budgetTotalHmnd: existing[0].budgetTotalHmnd ?? null,
      baseBudgetAllocatedHmnd: existing[0].baseBudgetAllocatedHmnd ?? null,
    };
  }

  const seed = await buildSeedFromReadModel(readModels, proposalId);
  const now = new Date();
  await db.insert(formationProjects).values({
    proposalId,
    teamSlotsTotal: seed.teamSlotsTotal,
    baseTeamFilled: seed.baseTeamFilled,
    milestonesTotal: seed.milestonesTotal,
    baseMilestonesCompleted: seed.baseMilestonesCompleted,
    budgetTotalHmnd: seed.budgetTotalHmnd,
    baseBudgetAllocatedHmnd: seed.baseBudgetAllocatedHmnd,
    createdAt: now,
    updatedAt: now,
  });

  if (seed.milestonesTotal > 0) {
    await db
      .insert(formationMilestones)
      .values(
        Array.from({ length: seed.milestonesTotal }, (_, idx) => {
          const milestoneIndex = idx + 1;
          return {
            proposalId,
            milestoneIndex,
            status:
              milestoneIndex <= seed.baseMilestonesCompleted
                ? "unlocked"
                : "todo",
            createdAt: now,
            updatedAt: now,
          };
        }),
      )
      .onConflictDoNothing({
        target: [
          formationMilestones.proposalId,
          formationMilestones.milestoneIndex,
        ],
      });
  }

  return seed;
}

export async function ensureFormationSeedFromInput(
  env: Env,
  input: { proposalId: string; seed: FormationSeedInput },
): Promise<void> {
  if (!env.DATABASE_URL) {
    const existing = memoryProjects.get(input.proposalId);
    if (existing) return;
    memoryProjects.set(input.proposalId, input.seed);
    const milestoneMap = new Map<number, FormationMilestoneStatus>();
    for (let i = 1; i <= input.seed.milestonesTotal; i += 1) {
      milestoneMap.set(
        i,
        i <= input.seed.baseMilestonesCompleted ? "unlocked" : "todo",
      );
    }
    memoryMilestones.set(input.proposalId, milestoneMap);
    if (!memoryTeam.has(input.proposalId))
      memoryTeam.set(input.proposalId, new Map());
    return;
  }

  const db = createDb(env);
  const existing = await db
    .select()
    .from(formationProjects)
    .where(eq(formationProjects.proposalId, input.proposalId))
    .limit(1);
  if (existing[0]) return;

  const now = new Date();
  await db.insert(formationProjects).values({
    proposalId: input.proposalId,
    teamSlotsTotal: input.seed.teamSlotsTotal,
    baseTeamFilled: input.seed.baseTeamFilled,
    milestonesTotal: input.seed.milestonesTotal,
    baseMilestonesCompleted: input.seed.baseMilestonesCompleted,
    budgetTotalHmnd: input.seed.budgetTotalHmnd,
    baseBudgetAllocatedHmnd: input.seed.baseBudgetAllocatedHmnd,
    createdAt: now,
    updatedAt: now,
  });

  if (input.seed.milestonesTotal > 0) {
    await db
      .insert(formationMilestones)
      .values(
        Array.from({ length: input.seed.milestonesTotal }, (_, idx) => {
          const milestoneIndex = idx + 1;
          return {
            proposalId: input.proposalId,
            milestoneIndex,
            status:
              milestoneIndex <= input.seed.baseMilestonesCompleted
                ? "unlocked"
                : "todo",
            createdAt: now,
            updatedAt: now,
          };
        }),
      )
      .onConflictDoNothing({
        target: [
          formationMilestones.proposalId,
          formationMilestones.milestoneIndex,
        ],
      });
  }
}

export function buildV1FormationSeedFromProposalPayload(
  payload: unknown,
): FormationSeedInput {
  const record =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;

  const timeline = Array.isArray(record?.timeline)
    ? (record?.timeline as unknown[])
    : [];
  const budgetItems = Array.isArray(record?.budgetItems)
    ? (record?.budgetItems as Array<Record<string, unknown>>)
    : [];

  const budgetTotalHmnd = budgetItems.reduce((sum, item) => {
    const amountRaw = typeof item.amount === "string" ? item.amount : "";
    const n = Number(amountRaw);
    if (!Number.isFinite(n) || n <= 0) return sum;
    return sum + n;
  }, 0);

  return {
    teamSlotsTotal: 3,
    baseTeamFilled: 1,
    milestonesTotal: timeline.length,
    baseMilestonesCompleted: 0,
    budgetTotalHmnd: budgetTotalHmnd > 0 ? budgetTotalHmnd : null,
    baseBudgetAllocatedHmnd: 0,
  };
}

export async function getFormationSummary(
  env: Env,
  readModels: ReadModelsStore,
  proposalId: string,
): Promise<FormationSummary> {
  const seed = await ensureFormationSeed(env, readModels, proposalId);
  if (!env.DATABASE_URL) {
    const teamCount = memoryTeam.get(proposalId)?.size ?? 0;
    const milestones = memoryMilestones.get(proposalId);
    const completed = milestones
      ? Array.from(milestones.values()).filter((s) => s === "unlocked").length
      : seed.baseMilestonesCompleted;
    return {
      teamFilled: seed.baseTeamFilled + teamCount,
      teamTotal: seed.teamSlotsTotal,
      milestonesCompleted: completed,
      milestonesTotal: seed.milestonesTotal,
    };
  }

  const db = createDb(env);
  const [teamAgg] = await db
    .select({ n: sql<number>`count(*)` })
    .from(formationTeam)
    .where(eq(formationTeam.proposalId, proposalId));
  const [milestoneAgg] = await db
    .select({
      n: sql<number>`sum(case when ${formationMilestones.status} = 'unlocked' then 1 else 0 end)`,
    })
    .from(formationMilestones)
    .where(eq(formationMilestones.proposalId, proposalId));

  return {
    teamFilled: seed.baseTeamFilled + Number(teamAgg?.n ?? 0),
    teamTotal: seed.teamSlotsTotal,
    milestonesCompleted: Number(
      milestoneAgg?.n ?? seed.baseMilestonesCompleted,
    ),
    milestonesTotal: seed.milestonesTotal,
  };
}

export async function listFormationJoiners(
  env: Env,
  proposalId: string,
): Promise<{ address: string; role?: string | null }[]> {
  if (!env.DATABASE_URL) {
    const team = memoryTeam.get(proposalId);
    if (!team) return [];
    return Array.from(team.entries()).map(([address, meta]) => ({
      address,
      role: meta.role ?? null,
    }));
  }

  const db = createDb(env);
  const rows = await db
    .select({
      address: formationTeam.memberAddress,
      role: formationTeam.role,
    })
    .from(formationTeam)
    .where(eq(formationTeam.proposalId, proposalId));
  return rows.map((r) => ({ address: r.address, role: r.role ?? null }));
}

export async function joinFormationProject(
  env: Env,
  readModels: ReadModelsStore,
  input: { proposalId: string; memberAddress: string; role?: string | null },
): Promise<{ summary: FormationSummary; created: boolean }> {
  const seed = await ensureFormationSeed(env, readModels, input.proposalId);
  const address = input.memberAddress.trim();

  if (!env.DATABASE_URL) {
    const team = memoryTeam.get(input.proposalId) ?? new Map();
    const created = !team.has(address);
    if (created) {
      const current = seed.baseTeamFilled + team.size;
      if (current >= seed.teamSlotsTotal) throw new Error("team_full");
      team.set(address, { role: input.role ?? null });
      memoryTeam.set(input.proposalId, team);
    }
    return {
      summary: await getFormationSummary(env, readModels, input.proposalId),
      created,
    };
  }

  const db = createDb(env);
  const existing = await db
    .select({ memberAddress: formationTeam.memberAddress })
    .from(formationTeam)
    .where(
      and(
        eq(formationTeam.proposalId, input.proposalId),
        eq(formationTeam.memberAddress, address),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    return {
      summary: await getFormationSummary(env, readModels, input.proposalId),
      created: false,
    };
  }

  const currentSummary = await getFormationSummary(
    env,
    readModels,
    input.proposalId,
  );
  if (currentSummary.teamFilled >= currentSummary.teamTotal)
    throw new Error("team_full");

  const now = new Date();
  await db
    .insert(formationTeam)
    .values({
      proposalId: input.proposalId,
      memberAddress: address,
      role: input.role ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({
      target: [formationTeam.proposalId, formationTeam.memberAddress],
    });

  return {
    summary: await getFormationSummary(env, readModels, input.proposalId),
    created: true,
  };
}

export async function submitFormationMilestone(
  env: Env,
  readModels: ReadModelsStore,
  input: {
    proposalId: string;
    milestoneIndex: number;
    actorAddress: string;
    note?: string | null;
  },
): Promise<{ summary: FormationSummary; created: boolean }> {
  const seed = await ensureFormationSeed(env, readModels, input.proposalId);
  if (input.milestoneIndex < 1 || input.milestoneIndex > seed.milestonesTotal) {
    throw new Error("milestone_out_of_range");
  }

  if (!env.DATABASE_URL) {
    const milestones = memoryMilestones.get(input.proposalId);
    if (!milestones) throw new Error("milestones_missing");
    const current = milestones.get(input.milestoneIndex) ?? "todo";
    if (current === "unlocked") throw new Error("milestone_already_unlocked");
    const created = current !== "submitted";
    if (created) milestones.set(input.milestoneIndex, "submitted");
    return {
      summary: await getFormationSummary(env, readModels, input.proposalId),
      created,
    };
  }

  const db = createDb(env);
  const now = new Date();
  const rows = await db
    .select({ status: formationMilestones.status })
    .from(formationMilestones)
    .where(
      and(
        eq(formationMilestones.proposalId, input.proposalId),
        eq(formationMilestones.milestoneIndex, input.milestoneIndex),
      ),
    )
    .limit(1);
  const current = rows[0]?.status;
  if (current === "unlocked") throw new Error("milestone_already_unlocked");
  const created = current !== "submitted";

  await db
    .insert(formationMilestones)
    .values({
      proposalId: input.proposalId,
      milestoneIndex: input.milestoneIndex,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        formationMilestones.proposalId,
        formationMilestones.milestoneIndex,
      ],
      set: { status: "submitted", updatedAt: now },
    });

  await db.insert(formationMilestoneEvents).values({
    proposalId: input.proposalId,
    milestoneIndex: input.milestoneIndex,
    type: "submit",
    actorAddress: input.actorAddress,
    payload: { note: input.note ?? null },
    createdAt: now,
  });

  return {
    summary: await getFormationSummary(env, readModels, input.proposalId),
    created,
  };
}

export async function requestFormationMilestoneUnlock(
  env: Env,
  readModels: ReadModelsStore,
  input: {
    proposalId: string;
    milestoneIndex: number;
    actorAddress: string;
  },
): Promise<{ summary: FormationSummary; created: boolean }> {
  const seed = await ensureFormationSeed(env, readModels, input.proposalId);
  if (input.milestoneIndex < 1 || input.milestoneIndex > seed.milestonesTotal) {
    throw new Error("milestone_out_of_range");
  }

  if (!env.DATABASE_URL) {
    const milestones = memoryMilestones.get(input.proposalId);
    if (!milestones) throw new Error("milestones_missing");
    const current = milestones.get(input.milestoneIndex) ?? "todo";
    if (current === "unlocked") throw new Error("milestone_already_unlocked");
    if (current === "todo") throw new Error("milestone_not_submitted");
    milestones.set(input.milestoneIndex, "unlocked");
    return {
      summary: await getFormationSummary(env, readModels, input.proposalId),
      created: true,
    };
  }

  const db = createDb(env);
  const now = new Date();
  const rows = await db
    .select({ status: formationMilestones.status })
    .from(formationMilestones)
    .where(
      and(
        eq(formationMilestones.proposalId, input.proposalId),
        eq(formationMilestones.milestoneIndex, input.milestoneIndex),
      ),
    )
    .limit(1);
  const current = rows[0]?.status;
  if (current === "unlocked") throw new Error("milestone_already_unlocked");
  if (current === "todo" || current === undefined)
    throw new Error("milestone_not_submitted");

  await db
    .insert(formationMilestones)
    .values({
      proposalId: input.proposalId,
      milestoneIndex: input.milestoneIndex,
      status: "unlocked",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        formationMilestones.proposalId,
        formationMilestones.milestoneIndex,
      ],
      set: { status: "unlocked", updatedAt: now },
    });

  await db.insert(formationMilestoneEvents).values({
    proposalId: input.proposalId,
    milestoneIndex: input.milestoneIndex,
    type: "request_unlock",
    actorAddress: input.actorAddress,
    payload: {},
    createdAt: now,
  });

  return {
    summary: await getFormationSummary(env, readModels, input.proposalId),
    created: true,
  };
}

export function clearFormationForTests() {
  memoryProjects.clear();
  memoryTeam.clear();
  memoryMilestones.clear();
}

async function buildSeedFromReadModel(
  readModels: ReadModelsStore,
  proposalId: string,
): Promise<FormationProjectSeed> {
  const payload = await readModels.get(`proposals:${proposalId}:formation`);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      teamSlotsTotal: 0,
      baseTeamFilled: 0,
      milestonesTotal: 0,
      baseMilestonesCompleted: 0,
      budgetTotalHmnd: null,
      baseBudgetAllocatedHmnd: null,
    };
  }

  const anyPayload = payload as Record<string, unknown>;
  const team = parseRatio(asString(anyPayload.teamSlots, ""));
  const milestones = parseRatio(asString(anyPayload.milestones, ""));

  const stageData = Array.isArray(anyPayload.stageData)
    ? anyPayload.stageData
    : [];
  const budgetEntry = stageData.find(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      !Array.isArray(entry) &&
      String((entry as Record<string, unknown>).title ?? "")
        .toLowerCase()
        .includes("budget"),
  ) as Record<string, unknown> | undefined;
  const budgetPair = parseRatio(asString(budgetEntry?.value, ""));

  return {
    teamSlotsTotal: team?.total ?? 0,
    baseTeamFilled: team?.filled ?? 0,
    milestonesTotal: milestones?.total ?? 0,
    baseMilestonesCompleted: milestones?.filled ?? 0,
    budgetTotalHmnd: budgetPair ? budgetPair.total : null,
    baseBudgetAllocatedHmnd: budgetPair ? budgetPair.filled : null,
  };
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseRatio(input: string): { filled: number; total: number } | null {
  const normalized = input.replace(/HMND/gi, "").trim();
  if (!normalized) return null;
  const parts = normalized.split("/").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const filled = parseHmndNumber(parts[0]);
  const total = parseHmndNumber(parts[1]);
  if (filled === null || total === null) return null;
  return { filled, total };
}

function parseHmndNumber(input: string): number | null {
  const s = input.trim().replace(/,/g, "").toLowerCase();
  if (!s) return null;
  const match = s.match(/^([0-9]+(?:\.[0-9]+)?)\s*([km])?$/);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return null;
  const suffix = match[2];
  if (suffix === "k") return Math.round(n * 1_000);
  if (suffix === "m") return Math.round(n * 1_000_000);
  return Math.round(n);
}
