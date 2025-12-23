CREATE TABLE "clock_state" (
	"id" integer PRIMARY KEY NOT NULL,
	"current_era" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eligibility_cache" (
	"address" text PRIMARY KEY NOT NULL,
	"is_active_human_node" integer NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text DEFAULT 'rpc' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"reason_code" text
);
--> statement-breakpoint
CREATE TABLE "read_models" (
	"key" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"address" text PRIMARY KEY NOT NULL,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
