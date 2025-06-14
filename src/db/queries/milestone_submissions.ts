import { and, eq, desc } from "drizzle-orm";
import { db } from "../db";
import {
  milestoneSubmissions,
  type MilestoneSubmission,
  type NewMilestoneSubmission,
} from "../schema/milestone_submissions";
import { milestones } from "../schema/milestones";
import { teams } from "../schema/teams";

// Types are typically exported from the schema file itself if generated with `export const ...`
// Re-exporting here for clarity or if they are not directly exported from schema.
export type { MilestoneSubmission, NewMilestoneSubmission };

// 1. Create Milestone Submission
export async function createMilestoneSubmission(
  data: NewMilestoneSubmission
): Promise<MilestoneSubmission[]> {
  return await db.insert(milestoneSubmissions).values(data).returning();
}

// 2. Get Milestone Submission by ID
export async function getMilestoneSubmissionById(
  submissionId: number
): Promise<MilestoneSubmission | undefined> {
  const result = await db
    .select()
    .from(milestoneSubmissions)
    .where(eq(milestoneSubmissions.id, submissionId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Custom type for the result of getMilestoneSubmissionWithProjectInfoById
export type MilestoneSubmissionWithProjectInfo = MilestoneSubmission & {
  projectId: number;
  projectOwnerId: number;
  milestoneStatus: string; // Assuming status is a string, adjust if it's an enum type
};

// 5. Get Milestone Submission by ID with Project Information (Revised)
export async function getMilestoneSubmissionWithProjectInfoById(
  submissionId: number
): Promise<MilestoneSubmissionWithProjectInfo | undefined> {
  const result = await db
    .select({
      // MilestoneSubmission fields
      id: milestoneSubmissions.id,
      milestoneId: milestoneSubmissions.milestoneId,
      teamId: milestoneSubmissions.teamId,
      filePath: milestoneSubmissions.filePath,
      notes: milestoneSubmissions.notes,
      submittedAt: milestoneSubmissions.submittedAt,
      // Project fields
      projectId: projects.id,
      projectOwnerId: projects.ownerId,
      // Milestone fields
      milestoneStatus: milestones.status,
    })
    .from(milestoneSubmissions)
    .innerJoin(milestones, eq(milestoneSubmissions.milestoneId, milestones.id))
    .innerJoin(projects, eq(milestones.projectId, projects.id))
    .where(eq(milestoneSubmissions.id, submissionId))
    .limit(1);

  if (result.length === 0) {
    return undefined;
  }
  // The result from Drizzle will be a flat object with all selected fields.
  // Cast to the custom type.
  return result[0] as MilestoneSubmissionWithProjectInfo;
}

// 3. Get Milestone Submissions by Milestone ID
export async function getMilestoneSubmissionsByMilestoneId(
  milestoneId: number
): Promise<MilestoneSubmission[]> {
  return await db
    .select()
    .from(milestoneSubmissions)
    .where(eq(milestoneSubmissions.milestoneId, milestoneId))
    .orderBy(desc(milestoneSubmissions.submittedAt)); // Order by most recent
}

// 4. Get Milestone Submission by Milestone and Team
// This function assumes we want the most recent submission if a team somehow submitted multiple times.
export async function getMilestoneSubmissionByMilestoneAndTeam(
  milestoneId: number,
  teamId: number
): Promise<MilestoneSubmission | undefined> {
  const result = await db
    .select()
    .from(milestoneSubmissions)
    .where(
      and(
        eq(milestoneSubmissions.milestoneId, milestoneId),
        eq(milestoneSubmissions.teamId, teamId)
      )
    )
    .orderBy(desc(milestoneSubmissions.submittedAt)) // Get the most recent one
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}
