import { and, eq, sql } from "drizzle-orm";

import { chamberMemberships } from "../../db/schema.ts";
import { createDb } from "./db.ts";

type Env = Record<string, string | undefined>;

const memoryByAddress = new Map<string, Set<string>>();

function normalizeChamberId(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeAddress(value: string): string {
  return value.trim();
}

export async function hasChamberMembership(
  env: Env,
  input: { address: string; chamberId: string },
): Promise<boolean> {
  const address = normalizeAddress(input.address);
  const chamberId = normalizeChamberId(input.chamberId);
  if (!env.DATABASE_URL) {
    const chambers = memoryByAddress.get(address);
    if (!chambers) return false;
    return chambers.has(chamberId);
  }

  const db = createDb(env);
  const rows = await db
    .select({ chamberId: chamberMemberships.chamberId })
    .from(chamberMemberships)
    .where(
      and(
        eq(chamberMemberships.address, address),
        eq(chamberMemberships.chamberId, chamberId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function hasAnyChamberMembership(
  env: Env,
  addressInput: string,
): Promise<boolean> {
  const address = normalizeAddress(addressInput);
  if (!env.DATABASE_URL) {
    const chambers = memoryByAddress.get(address);
    return Boolean(chambers && chambers.size > 0);
  }

  const db = createDb(env);
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(chamberMemberships)
    .where(eq(chamberMemberships.address, address))
    .limit(1);
  return Number(rows[0]?.n ?? 0) > 0;
}

export async function listChamberMemberships(
  env: Env,
  addressInput: string,
): Promise<string[]> {
  const address = normalizeAddress(addressInput);
  if (!env.DATABASE_URL) {
    return Array.from(memoryByAddress.get(address) ?? []).sort();
  }

  const db = createDb(env);
  const rows = await db
    .select({ chamberId: chamberMemberships.chamberId })
    .from(chamberMemberships)
    .where(eq(chamberMemberships.address, address));
  return rows.map((r) => r.chamberId).sort();
}

export async function listChamberMembers(
  env: Env,
  chamberIdInput: string,
): Promise<string[]> {
  const chamberId = normalizeChamberId(chamberIdInput);
  if (!env.DATABASE_URL) {
    const members: string[] = [];
    for (const [address, chambers] of memoryByAddress.entries()) {
      if (chambers.has(chamberId)) members.push(address);
    }
    return members.sort();
  }

  const db = createDb(env);
  const rows = await db
    .select({ address: chamberMemberships.address })
    .from(chamberMemberships)
    .where(eq(chamberMemberships.chamberId, chamberId));
  return rows.map((r) => r.address).sort();
}

export async function listAllChamberMembers(env: Env): Promise<string[]> {
  if (!env.DATABASE_URL) {
    return Array.from(memoryByAddress.keys()).sort();
  }

  const db = createDb(env);
  const rows = await db
    .select({ address: chamberMemberships.address })
    .from(chamberMemberships)
    .groupBy(chamberMemberships.address);
  return rows.map((r) => r.address).sort();
}

export async function ensureChamberMembership(
  env: Env,
  input: {
    address: string;
    chamberId: string;
    grantedByProposalId?: string | null;
    source?: string;
  },
): Promise<void> {
  const address = normalizeAddress(input.address);
  const chamberId = normalizeChamberId(input.chamberId);
  const source =
    (input.source ?? "accepted_proposal").trim() || "accepted_proposal";

  if (!env.DATABASE_URL) {
    const chambers = memoryByAddress.get(address) ?? new Set<string>();
    chambers.add(chamberId);
    memoryByAddress.set(address, chambers);
    return;
  }

  const db = createDb(env);
  await db
    .insert(chamberMemberships)
    .values({
      address,
      chamberId,
      grantedByProposalId: input.grantedByProposalId ?? null,
      source,
      createdAt: new Date(),
    })
    .onConflictDoNothing({
      target: [chamberMemberships.chamberId, chamberMemberships.address],
    });
}

export async function grantVotingEligibilityForAcceptedProposal(
  env: Env,
  input: { address: string; chamberId: string | null; proposalId: string },
): Promise<void> {
  await ensureChamberMembership(env, {
    address: input.address,
    chamberId: "general",
    grantedByProposalId: input.proposalId,
    source: "accepted_proposal",
  });

  const chamberId = normalizeChamberId(input.chamberId ?? "");
  if (chamberId && chamberId !== "general") {
    await ensureChamberMembership(env, {
      address: input.address,
      chamberId,
      grantedByProposalId: input.proposalId,
      source: "accepted_proposal",
    });
  }
}

export function clearChamberMembershipsForTests(): void {
  memoryByAddress.clear();
}
