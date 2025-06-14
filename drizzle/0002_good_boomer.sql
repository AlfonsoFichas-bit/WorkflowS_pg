CREATE TYPE "public"."project_roles" AS ENUM('PROJECT_OWNER', 'SCRUM_MASTER', 'DEVELOPER');--> statement-breakpoint
CREATE TYPE "public"."sprint_status" AS ENUM('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."user_story_priority" AS ENUM('LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST');--> statement-breakpoint
CREATE TYPE "public"."user_story_status" AS ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');--> statement-breakpoint
CREATE TABLE "user_stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"acceptance_criteria" text,
	"project_id" integer NOT NULL,
	"sprint_id" integer,
	"status" "user_story_status" DEFAULT 'TODO' NOT NULL,
	"priority" "user_story_priority" DEFAULT 'MEDIUM' NOT NULL,
	"story_points" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rubric_criteria" (
	"id" serial PRIMARY KEY NOT NULL,
	"rubric_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"weight" integer DEFAULT 1 NOT NULL,
	"max_score" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rubrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"creator_id" integer NOT NULL,
	"max_score" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"deadline" timestamp NOT NULL,
	"rubric_id" integer,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"creator_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sprints" DROP CONSTRAINT "sprints_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "team_members" ALTER COLUMN "role" SET DEFAULT 'DEVELOPER'::"public"."project_roles";--> statement-breakpoint
ALTER TABLE "team_members" ALTER COLUMN "role" SET DATA TYPE "public"."project_roles" USING "role"::"public"."project_roles";--> statement-breakpoint
ALTER TABLE "sprints" ALTER COLUMN "status" SET DEFAULT 'PLANNED'::"public"."sprint_status";--> statement-breakpoint
ALTER TABLE "sprints" ALTER COLUMN "status" SET DATA TYPE "public"."sprint_status" USING "status"::"public"."sprint_status";--> statement-breakpoint
ALTER TABLE "user_stories" ADD CONSTRAINT "user_stories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stories" ADD CONSTRAINT "user_stories_sprint_id_sprints_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."sprints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_criteria" ADD CONSTRAINT "rubric_criteria_rubric_id_rubrics_id_fk" FOREIGN KEY ("rubric_id") REFERENCES "public"."rubrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubrics" ADD CONSTRAINT "rubrics_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_rubric_id_rubrics_id_fk" FOREIGN KEY ("rubric_id") REFERENCES "public"."rubrics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;