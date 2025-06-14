CREATE TABLE "milestone_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"milestone_submission_id" integer NOT NULL,
	"evaluator_id" integer NOT NULL,
	"overall_score" integer,
	"general_feedback" text,
	"evaluation_timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "milestone_evaluations_milestone_submission_id_unique" UNIQUE("milestone_submission_id")
);
--> statement-breakpoint
ALTER TABLE "milestone_evaluations" ADD CONSTRAINT "milestone_evaluations_milestone_submission_id_milestone_submissions_id_fk" FOREIGN KEY ("milestone_submission_id") REFERENCES "public"."milestone_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_evaluations" ADD CONSTRAINT "milestone_evaluations_evaluator_id_users_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;