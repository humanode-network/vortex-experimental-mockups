CREATE TABLE "formation_projects" (
	"proposal_id" text PRIMARY KEY NOT NULL,
	"team_slots_total" integer NOT NULL,
	"base_team_filled" integer DEFAULT 0 NOT NULL,
	"milestones_total" integer NOT NULL,
	"base_milestones_completed" integer DEFAULT 0 NOT NULL,
	"budget_total_hmnd" integer,
	"base_budget_allocated_hmnd" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "formation_team" (
	"proposal_id" text NOT NULL,
	"member_address" text NOT NULL,
	"role" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "formation_team_pk" PRIMARY KEY("proposal_id","member_address")
);

CREATE TABLE "formation_milestones" (
	"proposal_id" text NOT NULL,
	"milestone_index" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "formation_milestones_pk" PRIMARY KEY("proposal_id","milestone_index")
);

CREATE TABLE "formation_milestone_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"proposal_id" text NOT NULL,
	"milestone_index" integer NOT NULL,
	"type" text NOT NULL,
	"actor_address" text,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
