CREATE TABLE "court_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"base_reports" integer DEFAULT 0 NOT NULL,
	"opened" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "court_reports" (
	"case_id" text NOT NULL,
	"reporter_address" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "court_reports_pk" PRIMARY KEY("case_id","reporter_address")
);

CREATE TABLE "court_verdicts" (
	"case_id" text NOT NULL,
	"voter_address" text NOT NULL,
	"verdict" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "court_verdicts_pk" PRIMARY KEY("case_id","voter_address")
);
