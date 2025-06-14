CREATE TABLE "milestone_user_stories" (
	"milestone_id" integer NOT NULL,
	"user_story_id" integer NOT NULL,
	CONSTRAINT "milestone_user_stories_milestone_id_user_story_id_pk" PRIMARY KEY("milestone_id","user_story_id")
);
--> statement-breakpoint
ALTER TABLE "milestone_user_stories" ADD CONSTRAINT "milestone_user_stories_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_user_stories" ADD CONSTRAINT "milestone_user_stories_user_story_id_user_stories_id_fk" FOREIGN KEY ("user_story_id") REFERENCES "public"."user_stories"("id") ON DELETE cascade ON UPDATE no action;