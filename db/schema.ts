import {
  bigserial,
  integer,
  jsonb,
  primaryKey,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  address: text("address").primaryKey(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const authNonces = pgTable("auth_nonces", {
  nonce: text("nonce").primaryKey(),
  address: text("address").notNull(),
  requestIp: text("request_ip"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const eligibilityCache = pgTable("eligibility_cache", {
  address: text("address").primaryKey(),
  isActiveHumanNode: integer("is_active_human_node").notNull(), // 0/1 for portability
  checkedAt: timestamp("checked_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  source: text("source").notNull().default("rpc"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  reasonCode: text("reason_code"),
});

export const clockState = pgTable("clock_state", {
  id: integer("id").primaryKey(),
  currentEra: integer("current_era").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Temporary storage for page read models during Phase 4 migration.
// Seed fixtures live in `db/seed/fixtures/*` while normalized tables + event log are built out.
export const readModels = pgTable("read_models", {
  key: text("key").primaryKey(),
  payload: jsonb("payload").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Append-only event log backbone (Phase 5).
export const events = pgTable("events", {
  seq: bigserial("seq", { mode: "number" }).primaryKey(),
  type: text("type").notNull(),
  stage: text("stage"),
  actorAddress: text("actor_address"),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const poolVotes = pgTable(
  "pool_votes",
  {
    proposalId: text("proposal_id").notNull(),
    voterAddress: text("voter_address").notNull(),
    direction: integer("direction").notNull(), // 1 (upvote) or -1 (downvote)
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.proposalId, t.voterAddress] }),
  }),
);

export const chamberVotes = pgTable(
  "chamber_votes",
  {
    proposalId: text("proposal_id").notNull(),
    voterAddress: text("voter_address").notNull(),
    choice: integer("choice").notNull(), // 1 (yes), -1 (no), 0 (abstain)
    score: integer("score"), // optional 1..10 CM input (v1)
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.proposalId, t.voterAddress] }),
  }),
);

export const idempotencyKeys = pgTable("idempotency_keys", {
  key: text("key").primaryKey(),
  address: text("address").notNull(),
  request: jsonb("request").notNull(),
  response: jsonb("response").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cmAwards = pgTable("cm_awards", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  proposalId: text("proposal_id").notNull(),
  proposerId: text("proposer_id").notNull(),
  chamberId: text("chamber_id").notNull(),
  avgScore: integer("avg_score"), // 1..10 scale (rounded)
  lcmPoints: integer("lcm_points").notNull(),
  chamberMultiplierTimes10: integer("chamber_multiplier_times10").notNull(),
  mcmPoints: integer("mcm_points").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const formationProjects = pgTable("formation_projects", {
  proposalId: text("proposal_id").primaryKey(),
  teamSlotsTotal: integer("team_slots_total").notNull(),
  baseTeamFilled: integer("base_team_filled").notNull().default(0),
  milestonesTotal: integer("milestones_total").notNull(),
  baseMilestonesCompleted: integer("base_milestones_completed")
    .notNull()
    .default(0),
  budgetTotalHmnd: integer("budget_total_hmnd"),
  baseBudgetAllocatedHmnd: integer("base_budget_allocated_hmnd"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const formationTeam = pgTable(
  "formation_team",
  {
    proposalId: text("proposal_id").notNull(),
    memberAddress: text("member_address").notNull(),
    role: text("role"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.proposalId, t.memberAddress] }),
  }),
);

export const formationMilestones = pgTable(
  "formation_milestones",
  {
    proposalId: text("proposal_id").notNull(),
    milestoneIndex: integer("milestone_index").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.proposalId, t.milestoneIndex] }),
  }),
);

export const formationMilestoneEvents = pgTable("formation_milestone_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  proposalId: text("proposal_id").notNull(),
  milestoneIndex: integer("milestone_index").notNull(),
  type: text("type").notNull(),
  actorAddress: text("actor_address"),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const courtCases = pgTable("court_cases", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  baseReports: integer("base_reports").notNull().default(0),
  opened: text("opened"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const courtReports = pgTable(
  "court_reports",
  {
    caseId: text("case_id").notNull(),
    reporterAddress: text("reporter_address").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.caseId, t.reporterAddress] }),
  }),
);

export const courtVerdicts = pgTable(
  "court_verdicts",
  {
    caseId: text("case_id").notNull(),
    voterAddress: text("voter_address").notNull(),
    verdict: text("verdict").notNull(), // guilty|not_guilty
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.caseId, t.voterAddress] }),
  }),
);

export const eraSnapshots = pgTable("era_snapshots", {
  era: integer("era").primaryKey(),
  activeGovernors: integer("active_governors").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const eraUserActivity = pgTable(
  "era_user_activity",
  {
    era: integer("era").notNull(),
    address: text("address").notNull(),
    poolVotes: integer("pool_votes").notNull().default(0),
    chamberVotes: integer("chamber_votes").notNull().default(0),
    courtActions: integer("court_actions").notNull().default(0),
    formationActions: integer("formation_actions").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.era, t.address] }),
  }),
);
