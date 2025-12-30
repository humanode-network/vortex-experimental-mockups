CREATE TABLE "proposal_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"author_address" text NOT NULL,
	"title" text NOT NULL,
	"chamber_id" text,
	"summary" text NOT NULL,
	"payload" jsonb NOT NULL,
	"submitted_at" timestamp with time zone,
	"submitted_proposal_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
