import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { milestoneSubmissions } from "./milestone_submissions";
import { users } from "./users";

export const milestoneEvaluations = pgTable("milestone_evaluations", {
  id: serial("id").primaryKey(),
  milestoneSubmissionId: integer("milestone_submission_id")
    .notNull()
    .unique()
    .references(() => milestoneSubmissions.id, { onDelete: "cascade" }),
  evaluatorId: integer("evaluator_id")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  overallScore: integer("overall_score"),
  generalFeedback: text("general_feedback"),
  evaluationTimestamp: timestamp("evaluation_timestamp").notNull().defaultNow(),
});
