CREATE TABLE "era_snapshots" (
	"era" integer PRIMARY KEY NOT NULL,
	"active_governors" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "era_user_activity" (
	"era" integer NOT NULL,
	"address" text NOT NULL,
	"pool_votes" integer DEFAULT 0 NOT NULL,
	"chamber_votes" integer DEFAULT 0 NOT NULL,
	"court_actions" integer DEFAULT 0 NOT NULL,
	"formation_actions" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "era_user_activity_pk" PRIMARY KEY("era","address")
);
