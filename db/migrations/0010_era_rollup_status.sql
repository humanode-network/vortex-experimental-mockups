CREATE TABLE "era_rollups" (
	"era" integer PRIMARY KEY NOT NULL,
	"required_pool_votes" integer DEFAULT 0 NOT NULL,
	"required_chamber_votes" integer DEFAULT 0 NOT NULL,
	"required_court_actions" integer DEFAULT 0 NOT NULL,
	"required_formation_actions" integer DEFAULT 0 NOT NULL,
	"required_total" integer DEFAULT 0 NOT NULL,
	"active_governors_next_era" integer DEFAULT 0 NOT NULL,
	"rolled_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "era_user_status" (
	"era" integer NOT NULL,
	"address" text NOT NULL,
	"status" text NOT NULL,
	"required_total" integer DEFAULT 0 NOT NULL,
	"completed_total" integer DEFAULT 0 NOT NULL,
	"is_active_next_era" boolean DEFAULT false NOT NULL,
	"pool_votes" integer DEFAULT 0 NOT NULL,
	"chamber_votes" integer DEFAULT 0 NOT NULL,
	"court_actions" integer DEFAULT 0 NOT NULL,
	"formation_actions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "era_user_status_pk" PRIMARY KEY("era","address")
);

