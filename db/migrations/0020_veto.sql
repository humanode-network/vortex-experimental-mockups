ALTER TABLE "proposals" ADD COLUMN "veto_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "proposals" ADD COLUMN "vote_passed_at" timestamp with time zone;
ALTER TABLE "proposals" ADD COLUMN "vote_finalizes_at" timestamp with time zone;
ALTER TABLE "proposals" ADD COLUMN "veto_council" jsonb;
ALTER TABLE "proposals" ADD COLUMN "veto_threshold" integer;

CREATE TABLE "veto_votes" (
  "proposal_id" text NOT NULL,
  "voter_address" text NOT NULL,
  "choice" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "veto_votes_proposal_id_voter_address_pk" PRIMARY KEY("proposal_id","voter_address")
);
