import { and, eq } from "drizzle-orm";
import { db } from "../db";
import {
  milestoneEvaluations,
  type MilestoneEvaluation,
  type NewMilestoneEvaluation,
} from "../schema/milestone_evaluations";
import {
  milestoneEvaluationCriteriaScores,
  type MilestoneEvaluationCriterionScore,
  type NewMilestoneEvaluationCriterionScore,
} from "../schema/milestone_evaluation_criteria_scores";
import { milestoneSubmissions } from "../schema/milestone_submissions";
import { users } from "../schema/users";
import { rubricCriteria } from "../schema/rubrics";
import type { DBExecuteResult } from "../types";

// Export inferred types
export type {
  MilestoneEvaluation,
  NewMilestoneEvaluation,
  MilestoneEvaluationCriterionScore,
  NewMilestoneEvaluationCriterionScore,
};

// Combined type for an evaluation with its criteria scores
export type MilestoneEvaluationWithCriteria = MilestoneEvaluation & {
  criteriaScores: MilestoneEvaluationCriterionScore[];
};

// 1. Create Milestone Evaluation (with criteria scores in a transaction)
export async function createMilestoneEvaluation(
  evaluationData: NewMilestoneEvaluation,
  criteriaScoresData?: NewMilestoneEvaluationCriterionScore[]
): Promise<MilestoneEvaluationWithCriteria[]> {
  return await db.transaction(async (tx) => {
    const newEvaluations = await tx
      .insert(milestoneEvaluations)
      .values(evaluationData)
      .returning();

    if (newEvaluations.length === 0) {
      tx.rollback(); // Should not happen if insert is successful
      throw new Error("Failed to create milestone evaluation record.");
    }
    const newEvaluation = newEvaluations[0];

    let createdCriteriaScores: MilestoneEvaluationCriterionScore[] = [];
    if (criteriaScoresData && criteriaScoresData.length > 0) {
      const scoresToInsert = criteriaScoresData.map((score) => ({
        ...score,
        milestoneEvaluationId: newEvaluation.id,
      }));
      createdCriteriaScores = await tx
        .insert(milestoneEvaluationCriteriaScores)
        .values(scoresToInsert)
        .returning();
    }

    return [{ ...newEvaluation, criteriaScores: createdCriteriaScores }];
  });
}

// Helper to fetch criteria scores for an evaluation ID
async function getCriteriaScoresForEvaluation(evaluationId: number): Promise<MilestoneEvaluationCriterionScore[]> {
    return await db
        .select()
        .from(milestoneEvaluationCriteriaScores)
        .where(eq(milestoneEvaluationCriteriaScores.milestoneEvaluationId, evaluationId));
}


// 2. Get Milestone Evaluation by ID (with criteria scores)
export async function getMilestoneEvaluationById(
  evaluationId: number
): Promise<MilestoneEvaluationWithCriteria | undefined> {
  const result = await db
    .select()
    .from(milestoneEvaluations)
    .where(eq(milestoneEvaluations.id, evaluationId))
    .limit(1);

  if (result.length === 0) {
    return undefined;
  }
  const evaluation = result[0];
  const criteriaScores = await getCriteriaScoresForEvaluation(evaluation.id);
  return { ...evaluation, criteriaScores };
}

// 3. Get Milestone Evaluation by Submission ID (with criteria scores)
export async function getMilestoneEvaluationBySubmissionId(
  submissionId: number
): Promise<MilestoneEvaluationWithCriteria | undefined> {
  const result = await db
    .select()
    .from(milestoneEvaluations)
    .where(eq(milestoneEvaluations.milestoneSubmissionId, submissionId))
    .limit(1); // unique constraint ensures at most one

  if (result.length === 0) {
    return undefined;
  }
  const evaluation = result[0];
  const criteriaScores = await getCriteriaScoresForEvaluation(evaluation.id);
  return { ...evaluation, criteriaScores };
}

// 4. Update Milestone Evaluation (with criteria scores in a transaction)
// Strategy for criteriaScores: delete existing and insert new ones.
export async function updateMilestoneEvaluation(
  evaluationId: number,
  evaluationData: Partial<NewMilestoneEvaluation>,
  newCriteriaScoresData?: Partial<NewMilestoneEvaluationCriterionScore>[] // Use Partial for updates
): Promise<MilestoneEvaluationWithCriteria[]> {
  return await db.transaction(async (tx) => {
    // Update the main evaluation record
    const updatedEvaluations = await tx
      .update(milestoneEvaluations)
      .set(evaluationData)
      .where(eq(milestoneEvaluations.id, evaluationId))
      .returning();

    if (updatedEvaluations.length === 0) {
      // tx.rollback(); // Drizzle might handle this implicitly on error
      throw new Error("Milestone evaluation not found or update failed.");
    }
    const updatedEvaluation = updatedEvaluations[0];

    let finalCriteriaScores: MilestoneEvaluationCriterionScore[] = [];

    // If newCriteriaScoresData is provided, replace existing scores
    if (newCriteriaScoresData !== undefined) {
      // Delete existing criteria scores for this evaluation
      await tx
        .delete(milestoneEvaluationCriteriaScores)
        .where(eq(milestoneEvaluationCriteriaScores.milestoneEvaluationId, evaluationId));

      // If there are new scores to add, insert them
      if (newCriteriaScoresData.length > 0) {
        const scoresToInsert = newCriteriaScoresData.map((score) => ({
          milestoneEvaluationId: evaluationId, // Ensure correct ID
          rubricCriteriaId: score.rubricCriteriaId!, // Assuming these are present for new scores
          score: score.score!, // Assuming these are present
          feedback: score.feedback,
        }));
        finalCriteriaScores = await tx
          .insert(milestoneEvaluationCriteriaScores)
          .values(scoresToInsert as NewMilestoneEvaluationCriterionScore[]) // Cast needed if partial might not satisfy New
          .returning();
      }
    } else {
      // If newCriteriaScoresData is not provided, just fetch the existing ones
      finalCriteriaScores = await getCriteriaScoresForEvaluation(evaluationId);
    }

    return [{ ...updatedEvaluation, criteriaScores: finalCriteriaScores }];
  });
}

// 5. Delete Milestone Evaluation
// This will also delete associated criteria scores due to DB cascade or manual delete if needed.
// Assuming DB has ON DELETE CASCADE for milestoneEvaluationCriteriaScores.milestoneEvaluationId.
// If not, manual deletion within a transaction is required.
// For this implementation, we'll assume cascade delete is set up at DB level for simplicity.
// If not, the delete function for criteria scores should be called here within a transaction.
export async function deleteMilestoneEvaluation(
  evaluationId: number
): Promise<DBExecuteResult> {
    // If cascade delete is not set on the foreign key in the DB schema for criteria scores,
    // you would need to delete them manually first within a transaction:
    // await db.transaction(async (tx) => {
    //   await tx.delete(milestoneEvaluationCriteriaScores)
    //             .where(eq(milestoneEvaluationCriteriaScores.milestoneEvaluationId, evaluationId));
    //   await tx.delete(milestoneEvaluations)
    //             .where(eq(milestoneEvaluations.id, evaluationId));
    // });
  return await db.delete(milestoneEvaluations).where(eq(milestoneEvaluations.id, evaluationId));
}
