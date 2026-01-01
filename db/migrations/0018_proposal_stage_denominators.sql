CREATE TABLE "proposal_stage_denominators" (
	"proposal_id" text NOT NULL,
	"stage" text NOT NULL,
	"era" integer NOT NULL,
	"active_governors" integer NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_stage_denominators_proposal_id_stage_pk" PRIMARY KEY("proposal_id","stage")
);
