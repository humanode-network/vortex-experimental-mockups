import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  address: text("address").primaryKey(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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

// Temporary storage for mock-equivalent page payloads during Phase 4 migration.
// This lets us seed from `src/data/mock/*` while we build normalized tables + event log.
export const readModels = pgTable("read_models", {
  key: text("key").primaryKey(),
  payload: jsonb("payload").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
