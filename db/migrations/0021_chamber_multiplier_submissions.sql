-- v1: chamber multiplier voting submissions (outsiders-only aggregation)

CREATE TABLE "chamber_multiplier_submissions" (
  "chamber_id" text NOT NULL,
  "voter_address" text NOT NULL,
  "multiplier_times10" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chamber_multiplier_submissions_chamber_id_voter_address_pk" PRIMARY KEY("chamber_id","voter_address"),
  CONSTRAINT "chamber_multiplier_submissions_multiplier_range" CHECK ("multiplier_times10" >= 1 AND "multiplier_times10" <= 100)
);
