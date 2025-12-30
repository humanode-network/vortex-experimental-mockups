CREATE TABLE "proposals" (
  "id" text PRIMARY KEY NOT NULL,
  "stage" text NOT NULL,
  "author_address" text NOT NULL,
  "title" text NOT NULL,
  "chamber_id" text,
  "summary" text NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

