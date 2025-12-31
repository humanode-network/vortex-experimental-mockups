CREATE TABLE "chambers" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"multiplier_times10" integer DEFAULT 10 NOT NULL,
	"created_by_proposal_id" text,
	"dissolved_by_proposal_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dissolved_at" timestamp with time zone
);
