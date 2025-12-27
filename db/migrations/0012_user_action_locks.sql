CREATE TABLE "user_action_locks" (
	"address" text PRIMARY KEY NOT NULL,
	"locked_until" timestamp with time zone NOT NULL,
	"reason" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

