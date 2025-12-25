import {
  bigserial,
  integer,
  jsonb,
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
