CREATE TABLE "chamber_votes" (
	"proposal_id" text NOT NULL,
	"voter_address" text NOT NULL,
	"choice" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chamber_votes_proposal_id_voter_address_pk" PRIMARY KEY("proposal_id","voter_address")
);

