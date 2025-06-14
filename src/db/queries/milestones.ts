import { and, eq } from "drizzle-orm";
import { db } from "../db";
import {
  milestones,
  type Milestone,
  type NewMilestone,
} from "../schema/milestones";
import { projects } from "../schema/projects";
import { users } from "../schema/users";
import { rubrics, rubricCriteria, type RubricCriterion } from "../schema/rubrics"; // Assuming RubricCriterion is exported
import { userStories, type UserStory } from "../schema/userStories"; // Assuming UserStory is exported
import { milestoneUserStories } from "../schema/milestone_user_stories";
import type { DBExecuteResult } from "../types";

// 1. Create Milestone
export async function createMilestone(
  data: NewMilestone
): Promise<Milestone[]> {
  return await db.insert(milestones).values(data).returning();
}

// 2. Get Milestones by Project ID
export async function getMilestonesByProjectId(
  projectId: number
): Promise<Milestone[]> {
  return await db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId));
}

// 3. Get Milestone by ID
export async function getMilestoneById(
  milestoneId: number
): Promise<Milestone | undefined> {
  const result = await db
    .select()
    .from(milestones)
    .where(eq(milestones.id, milestoneId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// 4. Update Milestone
export async function updateMilestone(
  milestoneId: number,
  data: Partial<NewMilestone>
): Promise<Milestone[]> {
  return await db
    .update(milestones)
    .set(data)
    .where(eq(milestones.id, milestoneId))
    .returning();
}

// 5. Delete Milestone
export async function deleteMilestone(
  milestoneId: number
): Promise<DBExecuteResult> {
  return await db.delete(milestones).where(eq(milestones.id, milestoneId));
}

// 6. Get User Stories by Milestone ID
export async function getUserStoriesByMilestoneId(
  milestoneId: number
): Promise<UserStory[]> {
  return await db
    .select({
      // Explicitly list all fields from userStories to match UserStory type
      id: userStories.id,
      title: userStories.title,
      description: userStories.description,
      acceptanceCriteria: userStories.acceptanceCriteria,
      projectId: userStories.projectId,
      sprintId: userStories.sprintId,
      status: userStories.status,
      priority: userStories.priority,
      storyPoints: userStories.storyPoints,
      createdAt: userStories.createdAt,
      updatedAt: userStories.updatedAt,
      // Ensure all fields expected by UserStory type are here
      // If UserStory type has more fields from the schema, add them.
      // For example, if it has creatorId or assignedToId, they should be selected.
      // Assuming the imported UserStory type from "../schema/userStories"
      // matches these fields.
    })
    .from(milestoneUserStories)
    .innerJoin(userStories, eq(milestoneUserStories.userStoryId, userStories.id))
    .where(eq(milestoneUserStories.milestoneId, milestoneId));
}

// 7. Get Milestone with Details (Refactored)
export async function getMilestoneWithDetails(milestoneId: number) {
  const milestoneResult = await db
    .select({
      id: milestones.id,
      name: milestones.name,
      description: milestones.description,
      deadline: milestones.deadline,
      status: milestones.status,
      createdAt: milestones.createdAt,
      updatedAt: milestones.updatedAt,
      projectId: milestones.projectId,
      creator: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
      },
      rubric: {
        id: rubrics.id,
        name: rubrics.name,
        description: rubrics.description,
        maxScore: rubrics.maxScore,
      },
    })
    .from(milestones)
    .leftJoin(users, eq(milestones.creatorId, users.id))
    .leftJoin(rubrics, eq(milestones.rubricId, rubrics.id))
    .where(eq(milestones.id, milestoneId))
    .limit(1);

  if (milestoneResult.length === 0) {
    return undefined;
  }

  const milestoneData = milestoneResult[0];

  const associatedUserStories = await getUserStoriesByMilestoneId(milestoneId);

  let rubricCriteriaDetails: RubricCriterion[] = []; // Ensure type
  if (milestoneData.rubric && milestoneData.rubric.id) {
    rubricCriteriaDetails = await db
      .select() // Select all fields for RubricCriterion
      .from(rubricCriteria)
      .where(eq(rubricCriteria.rubricId, milestoneData.rubric.id));
  }

  return {
    ...milestoneData,
    userStories: associatedUserStories,
    rubric: milestoneData.rubric?.id
      ? {
          ...milestoneData.rubric,
          criteria: rubricCriteriaDetails,
        }
      : undefined,
  };
}

// 8. Link User Stories to Milestone
export async function linkUserStoriesToMilestone(
  milestoneId: number,
  userStoryIds: number[]
): Promise<void> {
  // Use a transaction to ensure atomicity
  await db.transaction(async (tx) => {
    // First, delete all existing associations for the milestoneId
    await tx
      .delete(milestoneUserStories)
      .where(eq(milestoneUserStories.milestoneId, milestoneId));

    // If userStoryIds is not empty, insert new associations
    if (userStoryIds.length > 0) {
      const links = userStoryIds.map((userStoryId) => ({
        milestoneId,
        userStoryId,
      }));
      await tx.insert(milestoneUserStories).values(links);
    }
  });
}

// 9. Unlink User Story from Milestone
export async function unlinkUserStoryFromMilestone(
  milestoneId: number,
  userStoryId: number
): Promise<DBExecuteResult> {
  return await db
    .delete(milestoneUserStories)
    .where(
      and(
        eq(milestoneUserStories.milestoneId, milestoneId),
        eq(milestoneUserStories.userStoryId, userStoryId)
      )
    );
}

// Note: Types like Milestone, NewMilestone, UserStory, RubricCriterion
// are assumed to be correctly exported from their respective schema files
// (e.g., `export type UserStory = typeof userStories.$inferSelect;`)
// and then imported here. This is Drizzle's standard way.
// The DBExecuteResult type is a placeholder defined in `../types`.
