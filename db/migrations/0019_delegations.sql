CREATE TABLE "delegations" (
	"chamber_id" text NOT NULL,
	"delegator_address" text NOT NULL,
	"delegatee_address" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delegations_chamber_id_delegator_address_pk" PRIMARY KEY("chamber_id","delegator_address")
);
--> statement-breakpoint
CREATE TABLE "delegation_events" (
	"seq" bigserial PRIMARY KEY NOT NULL,
	"chamber_id" text NOT NULL,
	"delegator_address" text NOT NULL,
	"delegatee_address" text,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
