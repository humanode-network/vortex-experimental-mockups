CREATE TABLE "cm_awards" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"proposal_id" text NOT NULL,
	"proposer_id" text NOT NULL,
	"chamber_id" text NOT NULL,
	"avg_score" integer,
	"lcm_points" integer NOT NULL,
	"chamber_multiplier_times10" integer NOT NULL,
	"mcm_points" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cm_awards_proposal_id_unique" UNIQUE("proposal_id")
);

