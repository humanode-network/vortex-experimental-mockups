import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";

test("db migrations: contain core tables", () => {
  const migrationFiles = readdirSync("db/migrations")
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
  const sql = migrationFiles
    .map((name) => readFileSync(`db/migrations/${name}`, "utf8"))
    .join("\n");
  for (const table of [
    "admin_state",
    "users",
    "auth_nonces",
    "eligibility_cache",
    "clock_state",
    "read_models",
    "events",
    "pool_votes",
    "chamber_votes",
    "chamber_memberships",
    "chambers",
    "proposal_drafts",
    "proposal_stage_denominators",
    "proposals",
    "veto_votes",
    "chamber_multiplier_submissions",
    "delegations",
    "delegation_events",
    "idempotency_keys",
    "api_rate_limits",
    "cm_awards",
    "formation_projects",
    "formation_team",
    "formation_milestones",
    "formation_milestone_events",
    "court_cases",
    "court_reports",
    "court_verdicts",
    "era_snapshots",
    "era_user_activity",
    "era_rollups",
    "era_user_status",
    "user_action_locks",
  ]) {
    assert.match(sql, new RegExp(`CREATE TABLE\\s+\\"${table}\\"`));
  }
});
