CREATE TABLE "admin_state" (
	"id" integer PRIMARY KEY NOT NULL,
	"writes_frozen" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

