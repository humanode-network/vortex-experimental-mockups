CREATE TABLE "chamber_memberships" (
	"chamber_id" text NOT NULL,
	"address" text NOT NULL,
	"granted_by_proposal_id" text,
	"source" text DEFAULT 'accepted_proposal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chamber_memberships_chamber_id_address_pk" PRIMARY KEY("chamber_id","address")
);

