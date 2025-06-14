import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { milestoneEvaluations } from "./milestone_evaluations";
import { rubricCriteria } from "./rubrics"; // Assuming rubricCriteria is exported from rubrics.ts

export const milestoneEvaluationCriteriaScores = pgTable(
  "milestone_evaluation_criteria_scores",
  {
    id: serial("id").primaryKey(),
    milestoneEvaluationId: integer("milestone_evaluation_id")
      .notNull()
      .references(() => milestoneEvaluations.id, { onDelete: "cascade" }),
    rubricCriteriaId: integer("rubric_criteria_id")
      .notNull()
      .references(() => rubricCriteria.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    feedback: text("feedback"),
  }
);
