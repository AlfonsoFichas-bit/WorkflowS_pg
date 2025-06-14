CREATE TABLE "milestone_evaluation_criteria_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"milestone_evaluation_id" integer NOT NULL,
	"rubric_criteria_id" integer NOT NULL,
	"score" integer NOT NULL,
	"feedback" text
);
--> statement-breakpoint
ALTER TABLE "milestone_evaluation_criteria_scores" ADD CONSTRAINT "milestone_evaluation_criteria_scores_milestone_evaluation_id_milestone_evaluations_id_fk" FOREIGN KEY ("milestone_evaluation_id") REFERENCES "public"."milestone_evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_evaluation_criteria_scores" ADD CONSTRAINT "milestone_evaluation_criteria_scores_rubric_criteria_id_rubric_criteria_id_fk" FOREIGN KEY ("rubric_criteria_id") REFERENCES "public"."rubric_criteria"("id") ON DELETE cascade ON UPDATE no action;