import { and, eq, inArray, isNull, sql } from "drizzle-orm";

import {
  chambers as chambersTable,
  chambers,
  chamberMemberships,
  cmAwards,
  proposals,
} from "../../db/schema.ts";
import { createDb } from "./db.ts";
import { getSimConfig } from "./simConfig.ts";
import { createReadModelsStore } from "./readModelsStore.ts";
import {
  listAllChamberMembers,
  listChamberMembers,
} from "./chamberMembershipsStore.ts";
import { listCmAwards } from "./cmAwardsStore.ts";
import { listProposals } from "./proposalsStore.ts";

type Env = Record<string, string | undefined>;

export type ChamberStatus = "active" | "dissolved";

export type ChamberRecord = {
  id: string;
  title: string;
  status: ChamberStatus;
  multiplierTimes10: number;
  createdAt: Date;
  updatedAt: Date;
  dissolvedAt: Date | null;
};

const memory = new Map<string, ChamberRecord>();

const DEFAULT_GENESIS_CHAMBERS: {
  id: string;
  title: string;
  multiplier: number;
}[] = [
  { id: "general", title: "General", multiplier: 1.2 },
  { id: "design", title: "Design", multiplier: 1.4 },
  { id: "engineering", title: "Engineering", multiplier: 1.5 },
  { id: "economics", title: "Economics", multiplier: 1.3 },
  { id: "marketing", title: "Marketing", multiplier: 1.1 },
  { id: "product", title: "Product", multiplier: 1.2 },
];

function normalizeId(value: string): string {
  return value.trim().toLowerCase();
}

async function upsertChambersReadModel(
  env: Env,
  input: {
    action: "create" | "dissolve";
    id: string;
    title?: string;
    multiplier?: number;
  },
): Promise<void> {
  if (
    env.READ_MODELS_INLINE !== "true" &&
    env.READ_MODELS_INLINE_EMPTY !== "true"
  ) {
    return;
  }
  const store = await createReadModelsStore(env).catch(() => null);
  if (!store?.set) return;

  const payload = await store.get("chambers:list");
  const existing =
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    Array.isArray((payload as { items?: unknown[] }).items)
      ? (payload as { items: unknown[] }).items
      : [];

  const normalizedId = normalizeId(input.id);
  const nextItems = existing.filter((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return true;
    return (
      String((item as { id?: string }).id ?? "").toLowerCase() !== normalizedId
    );
  });

  if (input.action === "create") {
    const multiplier =
      typeof input.multiplier === "number" && Number.isFinite(input.multiplier)
        ? input.multiplier
        : 1;
    nextItems.push({
      id: normalizedId,
      name: input.title?.trim() || normalizedId,
      multiplier,
      stats: { governors: "0", acm: "0", mcm: "0", lcm: "0" },
      pipeline: { pool: 0, vote: 0, build: 0 },
      status: "active",
    });

    await store.set(`chambers:${normalizedId}`, {
      proposals: [],
      governors: [],
      threads: [],
      chatLog: [],
      stageOptions: [
        { value: "upcoming", label: "Upcoming" },
        { value: "live", label: "Live" },
        { value: "ended", label: "Ended" },
      ],
    });
  }

  await store.set("chambers:list", {
    ...(payload && typeof payload === "object" && !Array.isArray(payload)
      ? payload
      : {}),
    items: nextItems,
  });
}

function getGenesisChambersFromConfig(
  cfg: unknown,
): typeof DEFAULT_GENESIS_CHAMBERS {
  const config = cfg as {
    genesisChambers?: { id: string; title: string; multiplier: number }[];
  } | null;
  return config?.genesisChambers && config.genesisChambers.length > 0
    ? config.genesisChambers
    : DEFAULT_GENESIS_CHAMBERS;
}

export async function ensureGenesisChambers(
  env: Env,
  requestUrl: string,
): Promise<void> {
  const cfg = await getSimConfig(env, requestUrl);
  const genesis = getGenesisChambersFromConfig(cfg);
  const now = new Date();

  if (!env.DATABASE_URL) {
    if (memory.size > 0) return;
    for (const chamber of genesis) {
      const id = normalizeId(chamber.id);
      if (!id) continue;
      memory.set(id, {
        id,
        title: chamber.title.trim() || id,
        status: "active",
        multiplierTimes10: Math.round((chamber.multiplier || 1) * 10),
        createdAt: now,
        updatedAt: now,
        dissolvedAt: null,
      });
    }
    return;
  }

  const db = createDb(env);
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(chambers)
    .limit(1);
  if (Number(rows[0]?.n ?? 0) > 0) return;

  await db.insert(chambers).values(
    genesis.map((chamber) => ({
      id: normalizeId(chamber.id),
      title: chamber.title.trim() || chamber.id,
      status: "active",
      multiplierTimes10: Math.round((chamber.multiplier || 1) * 10),
      createdByProposalId: null,
      dissolvedByProposalId: null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
      dissolvedAt: null,
    })),
  );
}

export async function getChamber(
  env: Env,
  requestUrl: string,
  chamberId: string,
): Promise<ChamberRecord | null> {
  await ensureGenesisChambers(env, requestUrl);
  const id = normalizeId(chamberId);

  if (!env.DATABASE_URL) return memory.get(id) ?? null;

  const db = createDb(env);
  const rows = await db
    .select({
      id: chambers.id,
      title: chambers.title,
      status: chambers.status,
      multiplierTimes10: chambers.multiplierTimes10,
      createdAt: chambers.createdAt,
      updatedAt: chambers.updatedAt,
      dissolvedAt: chambers.dissolvedAt,
    })
    .from(chambers)
    .where(eq(chambers.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    status: row.status as ChamberStatus,
    multiplierTimes10: row.multiplierTimes10,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    dissolvedAt: row.dissolvedAt ?? null,
  };
}

export async function listChambers(
  env: Env,
  requestUrl: string,
  input?: { includeDissolved?: boolean },
): Promise<ChamberRecord[]> {
  await ensureGenesisChambers(env, requestUrl);
  const includeDissolved = Boolean(input?.includeDissolved);

  if (!env.DATABASE_URL) {
    const rows = Array.from(memory.values());
    return rows
      .filter((c) => includeDissolved || c.status === "active")
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  const db = createDb(env);
  const base = db
    .select({
      id: chambers.id,
      title: chambers.title,
      status: chambers.status,
      multiplierTimes10: chambers.multiplierTimes10,
      createdAt: chambers.createdAt,
      updatedAt: chambers.updatedAt,
      dissolvedAt: chambers.dissolvedAt,
    })
    .from(chambers);
  const rows = includeDissolved
    ? await base
    : await base.where(eq(chambers.status, "active"));
  return rows
    .map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status as ChamberStatus,
      multiplierTimes10: row.multiplierTimes10,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      dissolvedAt: row.dissolvedAt ?? null,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function createChamberFromAcceptedGeneralProposal(
  env: Env,
  requestUrl: string,
  input: {
    id: string;
    title: string;
    multiplier?: number;
    proposalId: string;
  },
): Promise<void> {
  await ensureGenesisChambers(env, requestUrl);
  const id = normalizeId(input.id);
  if (!id || id === "general") return;

  const now = new Date();
  const multiplierTimes10 = Math.round(((input.multiplier ?? 1) || 1) * 10);

  if (!env.DATABASE_URL) {
    if (memory.has(id)) return;
    memory.set(id, {
      id,
      title: input.title.trim() || id,
      status: "active",
      multiplierTimes10,
      createdAt: now,
      updatedAt: now,
      dissolvedAt: null,
    });
    await upsertChambersReadModel(env, {
      action: "create",
      id,
      title: input.title,
      multiplier: input.multiplier,
    });
    return;
  }

  const db = createDb(env);
  await db
    .insert(chambers)
    .values({
      id,
      title: input.title.trim() || id,
      status: "active",
      multiplierTimes10,
      createdByProposalId: input.proposalId,
      dissolvedByProposalId: null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
      dissolvedAt: null,
    })
    .onConflictDoNothing({ target: chambers.id });

  await upsertChambersReadModel(env, {
    action: "create",
    id,
    title: input.title,
    multiplier: input.multiplier,
  });
}

export async function dissolveChamberFromAcceptedGeneralProposal(
  env: Env,
  requestUrl: string,
  input: { id: string; proposalId: string },
): Promise<void> {
  await ensureGenesisChambers(env, requestUrl);
  const id = normalizeId(input.id);
  if (!id || id === "general") return;

  const now = new Date();

  if (!env.DATABASE_URL) {
    const existing = memory.get(id);
    if (!existing || existing.status === "dissolved") return;
    memory.set(id, {
      ...existing,
      status: "dissolved",
      dissolvedAt: now,
      updatedAt: now,
    });
    await upsertChambersReadModel(env, { action: "dissolve", id });
    return;
  }

  const db = createDb(env);
  await db
    .update(chambers)
    .set({
      status: "dissolved",
      dissolvedAt: now,
      dissolvedByProposalId: input.proposalId,
      updatedAt: now,
    })
    .where(and(eq(chambers.id, id), isNull(chambers.dissolvedAt)));

  await upsertChambersReadModel(env, { action: "dissolve", id });
}

export function parseChamberGovernanceFromPayload(payload: unknown): {
  action: "chamber.create" | "chamber.dissolve";
  id: string;
  title?: string;
  multiplier?: number;
} | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return null;
  const record = payload as Record<string, unknown>;
  const mg = record.metaGovernance;
  if (!mg || typeof mg !== "object" || Array.isArray(mg)) return null;
  const meta = mg as Record<string, unknown>;
  const action = typeof meta.action === "string" ? meta.action : "";
  if (action !== "chamber.create" && action !== "chamber.dissolve") return null;
  const id =
    typeof meta.chamberId === "string"
      ? meta.chamberId
      : typeof meta.id === "string"
        ? meta.id
        : "";
  const title =
    typeof meta.title === "string"
      ? meta.title
      : typeof meta.name === "string"
        ? meta.name
        : undefined;
  const multiplier =
    typeof meta.multiplier === "number" ? meta.multiplier : undefined;
  return { action, id, title, multiplier };
}

export async function getChamberMultiplierTimes10(
  env: Env,
  requestUrl: string,
  chamberIdInput: string,
): Promise<number> {
  const id = normalizeId(chamberIdInput);
  const chamber = await getChamber(env, requestUrl, id);
  return chamber?.multiplierTimes10 ?? 10;
}

export async function projectChamberPipeline(
  env: Env,
  input: { chamberId: string },
): Promise<{ pool: number; vote: number; build: number }> {
  const chamberId = normalizeId(input.chamberId);

  if (!env.DATABASE_URL) {
    const items = await listProposals(env);
    let pool = 0;
    let vote = 0;
    let build = 0;
    for (const proposal of items) {
      const proposalChamberId = normalizeId(proposal.chamberId ?? "general");
      if (proposalChamberId !== chamberId) continue;
      if (proposal.stage === "pool") pool += 1;
      else if (proposal.stage === "vote") vote += 1;
      else if (proposal.stage === "build") build += 1;
    }
    return { pool, vote, build };
  }
  const db = createDb(env);

  const rows = await db
    .select({
      stage: proposals.stage,
      count: sql<number>`count(*)`,
    })
    .from(proposals)
    .where(eq(proposals.chamberId, chamberId))
    .groupBy(proposals.stage);

  let pool = 0;
  let vote = 0;
  let build = 0;
  for (const row of rows) {
    const stage = String(row.stage);
    if (stage === "pool") pool += Number(row.count);
    else if (stage === "vote") vote += Number(row.count);
    else if (stage === "build") build += Number(row.count);
  }
  return { pool, vote, build };
}

export async function projectChamberStats(
  env: Env,
  requestUrl: string,
  input: { chamberId: string },
): Promise<{ governors: number; acm: number; lcm: number; mcm: number }> {
  const chamberId = normalizeId(input.chamberId);
  const cfg = await getSimConfig(env, requestUrl);
  const genesisMembers = cfg?.genesisChamberMembers ?? undefined;

  if (!env.DATABASE_URL) {
    const memberAddresses = new Set<string>();
    if (chamberId === "general") {
      if (genesisMembers) {
        for (const list of Object.values(genesisMembers)) {
          for (const addr of list) memberAddresses.add(addr.trim());
        }
      }
      for (const addr of await listAllChamberMembers(env)) {
        memberAddresses.add(addr.trim());
      }
    } else {
      if (genesisMembers) {
        for (const addr of genesisMembers[chamberId] ?? [])
          memberAddresses.add(addr.trim());
      }
      for (const addr of await listChamberMembers(env, chamberId)) {
        memberAddresses.add(addr.trim());
      }
    }

    const members = Array.from(memberAddresses);
    const governors = members.length;
    if (governors === 0) return { governors: 0, acm: 0, lcm: 0, mcm: 0 };

    const allAwards = await listCmAwards(env, { proposerIds: members });
    const multiplierByChamberId = new Map<string, number>();
    for (const chamber of await listChambers(env, requestUrl, {
      includeDissolved: true,
    })) {
      multiplierByChamberId.set(chamber.id, chamber.multiplierTimes10);
    }
    const acmPoints = allAwards.reduce((sum, award) => {
      const times10 = multiplierByChamberId.get(award.chamberId) ?? 10;
      return sum + Math.round((award.lcmPoints * times10) / 10);
    }, 0);

    const chamberAwards = await listCmAwards(env, {
      proposerIds: members,
      chamberId,
    });
    const lcmPoints = chamberAwards.reduce(
      (sum, award) => sum + award.lcmPoints,
      0,
    );
    const chamberTimes10 = multiplierByChamberId.get(chamberId) ?? 10;
    const mcmPoints = chamberAwards.reduce(
      (sum, award) => sum + Math.round((award.lcmPoints * chamberTimes10) / 10),
      0,
    );

    const acm = Math.round(acmPoints / 10);
    const lcm = Math.round(lcmPoints / 10);
    const mcm = Math.round(mcmPoints / 10);
    return { governors, acm, lcm, mcm };
  }

  const db = createDb(env);

  const memberAddresses = new Set<string>();
  if (chamberId === "general") {
    const rows = await db
      .selectDistinct({ address: chamberMemberships.address })
      .from(chamberMemberships);
    for (const row of rows) memberAddresses.add(row.address);
    if (genesisMembers) {
      for (const list of Object.values(genesisMembers)) {
        for (const addr of list) memberAddresses.add(addr);
      }
    }
  } else {
    const rows = await db
      .selectDistinct({ address: chamberMemberships.address })
      .from(chamberMemberships)
      .where(eq(chamberMemberships.chamberId, chamberId));
    for (const row of rows) memberAddresses.add(row.address);
    if (genesisMembers) {
      for (const addr of genesisMembers[chamberId] ?? [])
        memberAddresses.add(addr);
    }
  }

  const members = Array.from(memberAddresses);
  const governors = members.length;
  if (members.length === 0) return { governors: 0, acm: 0, lcm: 0, mcm: 0 };

  const acmRows = await db
    .select({
      sum: sql<number>`coalesce(sum(round(${cmAwards.lcmPoints} * coalesce(${chambersTable.multiplierTimes10}, ${cmAwards.chamberMultiplierTimes10}, 10) / 10.0)), 0)`,
    })
    .from(cmAwards)
    .leftJoin(chambersTable, eq(chambersTable.id, cmAwards.chamberId))
    .where(inArray(cmAwards.proposerId, members));
  const chamberRows = await db
    .select({
      lcmSum: sql<number>`coalesce(sum(${cmAwards.lcmPoints}), 0)`,
      mcmSum: sql<number>`coalesce(sum(round(${cmAwards.lcmPoints} * coalesce(${chambersTable.multiplierTimes10}, ${cmAwards.chamberMultiplierTimes10}, 10) / 10.0)), 0)`,
    })
    .from(cmAwards)
    .leftJoin(chambersTable, eq(chambersTable.id, cmAwards.chamberId))
    .where(
      and(
        eq(cmAwards.chamberId, chamberId),
        inArray(cmAwards.proposerId, members),
      ),
    );

  const acm = Math.round(Number(acmRows[0]?.sum ?? 0) / 10);
  const lcm = Math.round(Number(chamberRows[0]?.lcmSum ?? 0) / 10);
  const mcm = Math.round(Number(chamberRows[0]?.mcmSum ?? 0) / 10);

  return { governors, acm, lcm, mcm };
}

export async function setChamberMultiplierTimes10(
  env: Env,
  requestUrl: string,
  input: { id: string; multiplierTimes10: number },
): Promise<{ updated: boolean; prevTimes10: number; nextTimes10: number }> {
  await ensureGenesisChambers(env, requestUrl);
  const id = normalizeId(input.id);
  const nextTimes10 = Math.floor(input.multiplierTimes10);
  if (!id) return { updated: false, prevTimes10: 10, nextTimes10 };

  if (!env.DATABASE_URL) {
    const existing = memory.get(id);
    const prevTimes10 = existing?.multiplierTimes10 ?? 10;
    if (!existing || existing.status !== "active") {
      return { updated: false, prevTimes10, nextTimes10 };
    }
    if (prevTimes10 === nextTimes10) {
      return { updated: false, prevTimes10, nextTimes10 };
    }
    const now = new Date();
    memory.set(id, {
      ...existing,
      multiplierTimes10: nextTimes10,
      updatedAt: now,
    });
    return { updated: true, prevTimes10, nextTimes10 };
  }

  const db = createDb(env);
  const row = await db
    .select({
      multiplierTimes10: chambers.multiplierTimes10,
      status: chambers.status,
    })
    .from(chambers)
    .where(eq(chambers.id, id))
    .limit(1);
  const prevTimes10 = row[0]?.multiplierTimes10 ?? 10;
  const status = row[0]?.status ?? null;
  if (status !== "active") return { updated: false, prevTimes10, nextTimes10 };
  if (prevTimes10 === nextTimes10) {
    return { updated: false, prevTimes10, nextTimes10 };
  }
  const now = new Date();
  await db
    .update(chambers)
    .set({ multiplierTimes10: nextTimes10, updatedAt: now })
    .where(eq(chambers.id, id));
  return { updated: true, prevTimes10, nextTimes10 };
}

export function clearChambersForTests(): void {
  memory.clear();
}
