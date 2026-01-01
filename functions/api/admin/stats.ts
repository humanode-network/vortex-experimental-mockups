import { eq, sql } from "drizzle-orm";

import {
  adminState,
  apiRateLimits,
  chamberVotes,
  cmAwards,
  courtCases,
  courtReports,
  courtVerdicts,
  eraRollups,
  eraUserActivity,
  events,
  formationMilestoneEvents,
  formationTeam,
  poolVotes,
  userActionLocks,
  users,
} from "../../../db/schema.ts";
import { createDb } from "../../_lib/db.ts";
import { getCommandRateLimitConfig } from "../../_lib/apiRateLimitStore.ts";
import { assertAdmin, createClockStore } from "../../_lib/clockStore.ts";
import { getEraQuotaConfig } from "../../_lib/eraQuotas.ts";
import { listEraUserActivity } from "../../_lib/eraStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";

type Env = Record<string, string | undefined>;

function sum(
  rows: Array<{
    poolVotes: number;
    chamberVotes: number;
    courtActions: number;
    formationActions: number;
  }>,
) {
  return rows.reduce(
    (acc, r) => ({
      poolVotes: acc.poolVotes + r.poolVotes,
      chamberVotes: acc.chamberVotes + r.chamberVotes,
      courtActions: acc.courtActions + r.courtActions,
      formationActions: acc.formationActions + r.formationActions,
    }),
    { poolVotes: 0, chamberVotes: 0, courtActions: 0, formationActions: 0 },
  );
}

async function getWritesFrozen(env: Env): Promise<boolean> {
  if (env.SIM_WRITE_FREEZE === "true") return true;
  if (env.READ_MODELS_INLINE === "true") return false;
  if (!env.DATABASE_URL) return false;
  const db = createDb(env);
  await db.insert(adminState).values({ id: 1 }).onConflictDoNothing();
  const rows = await db
    .select({ writesFrozen: adminState.writesFrozen })
    .from(adminState)
    .where(eq(adminState.id, 1))
    .limit(1);
  return rows[0]?.writesFrozen ?? false;
}

export const onRequestGet: PagesFunction = async (context) => {
  try {
    assertAdmin(context);
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    return errorResponse(status, (error as Error).message);
  }

  const clock = createClockStore(context.env);
  const { currentEra } = await clock.get();
  const rate = getCommandRateLimitConfig(context.env);
  const quotas = getEraQuotaConfig(context.env);
  const writesFrozen = await getWritesFrozen(context.env);

  if (!context.env.DATABASE_URL) {
    const rows = await listEraUserActivity(context.env, { era: currentEra });
    const totals = sum(rows);
    return jsonResponse({
      currentEra,
      writesFrozen,
      config: {
        rateLimitsPerMinute: rate,
        eraQuotas: quotas,
      },
      currentEraActivity: {
        rows: rows.length,
        totals,
      },
      db: null,
    });
  }

  const db = createDb(context.env);
  const now = new Date();

  const [
    usersCount,
    eventsCount,
    adminAuditCount,
    feedEventCount,
    poolVotesCount,
    chamberVotesCount,
    cmAwardsCount,
    formationTeamCount,
    formationMilestoneEventsCount,
    courtCasesCount,
    courtReportsCount,
    courtVerdictsCount,
    rateLimitBucketsCount,
    activeLocksCount,
    currentEraActivityRowsCount,
    currentEraActivityTotals,
    rollupsCount,
  ] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(users),
    db.select({ n: sql<number>`count(*)` }).from(events),
    db
      .select({ n: sql<number>`count(*)` })
      .from(events)
      .where(sql`${events.type} = 'admin.action.v1'`),
    db
      .select({ n: sql<number>`count(*)` })
      .from(events)
      .where(sql`${events.type} = 'feed.item.v1'`),
    db.select({ n: sql<number>`count(*)` }).from(poolVotes),
    db.select({ n: sql<number>`count(*)` }).from(chamberVotes),
    db.select({ n: sql<number>`count(*)` }).from(cmAwards),
    db.select({ n: sql<number>`count(*)` }).from(formationTeam),
    db.select({ n: sql<number>`count(*)` }).from(formationMilestoneEvents),
    db.select({ n: sql<number>`count(*)` }).from(courtCases),
    db.select({ n: sql<number>`count(*)` }).from(courtReports),
    db.select({ n: sql<number>`count(*)` }).from(courtVerdicts),
    db.select({ n: sql<number>`count(*)` }).from(apiRateLimits),
    db
      .select({ n: sql<number>`count(*)` })
      .from(userActionLocks)
      .where(sql`${userActionLocks.lockedUntil} > ${now}`),
    db
      .select({ n: sql<number>`count(*)` })
      .from(eraUserActivity)
      .where(sql`${eraUserActivity.era} = ${currentEra}`),
    db
      .select({
        poolVotes: sql<number>`sum(${eraUserActivity.poolVotes})`,
        chamberVotes: sql<number>`sum(${eraUserActivity.chamberVotes})`,
        courtActions: sql<number>`sum(${eraUserActivity.courtActions})`,
        formationActions: sql<number>`sum(${eraUserActivity.formationActions})`,
      })
      .from(eraUserActivity)
      .where(sql`${eraUserActivity.era} = ${currentEra}`),
    db.select({ n: sql<number>`count(*)` }).from(eraRollups),
  ]);

  return jsonResponse({
    currentEra,
    writesFrozen,
    config: {
      rateLimitsPerMinute: rate,
      eraQuotas: quotas,
    },
    db: {
      users: Number(usersCount[0]?.n ?? 0),
      events: {
        total: Number(eventsCount[0]?.n ?? 0),
        feedItems: Number(feedEventCount[0]?.n ?? 0),
        adminAudit: Number(adminAuditCount[0]?.n ?? 0),
      },
      actions: {
        poolVotes: Number(poolVotesCount[0]?.n ?? 0),
        chamberVotes: Number(chamberVotesCount[0]?.n ?? 0),
        cmAwards: Number(cmAwardsCount[0]?.n ?? 0),
        formationTeam: Number(formationTeamCount[0]?.n ?? 0),
        formationMilestoneEvents: Number(
          formationMilestoneEventsCount[0]?.n ?? 0,
        ),
        courtCases: Number(courtCasesCount[0]?.n ?? 0),
        courtReports: Number(courtReportsCount[0]?.n ?? 0),
        courtVerdicts: Number(courtVerdictsCount[0]?.n ?? 0),
      },
      hardening: {
        rateLimitBuckets: Number(rateLimitBucketsCount[0]?.n ?? 0),
        activeLocks: Number(activeLocksCount[0]?.n ?? 0),
      },
      eras: {
        rollups: Number(rollupsCount[0]?.n ?? 0),
        currentEraActivityRows: Number(currentEraActivityRowsCount[0]?.n ?? 0),
        currentEraTotals: {
          poolVotes: Number(currentEraActivityTotals[0]?.poolVotes ?? 0),
          chamberVotes: Number(currentEraActivityTotals[0]?.chamberVotes ?? 0),
          courtActions: Number(currentEraActivityTotals[0]?.courtActions ?? 0),
          formationActions: Number(
            currentEraActivityTotals[0]?.formationActions ?? 0,
          ),
        },
      },
    },
  });
};
