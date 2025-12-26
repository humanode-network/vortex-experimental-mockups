CREATE TABLE "idempotency_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"request" jsonb NOT NULL,
	"response" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pool_votes" (
	"proposal_id" text NOT NULL,
	"voter_address" text NOT NULL,
	"direction" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pool_votes_proposal_id_voter_address_pk" PRIMARY KEY("proposal_id","voter_address")
);
