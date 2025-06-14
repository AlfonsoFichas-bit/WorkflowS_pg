import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { userStories, type UserStory } from "../schema/userStories";
import { projects } from "../schema/projects"; // For project context if needed
// Import other schemas like sprints or users if you need to join for more details

// Re-export type
export type { UserStory };

/**
 * Retrieves all user stories for a specific project.
 * @param projectId The ID of the project.
 * @returns A list of user stories for the project.
 */
export async function getUserStoriesByProjectId(
  projectId: number
): Promise<UserStory[]> {
  return await db
    .select()
    .from(userStories)
    .where(eq(userStories.projectId, projectId));
}

/**
 * Retrieves a specific user story by its ID.
 * @param userStoryId The ID of the user story.
 * @returns The user story details, or undefined if not found.
 */
export async function getUserStoryById(
  userStoryId: number
): Promise<UserStory | undefined> {
  const result = await db
    .select()
    .from(userStories)
    .where(eq(userStories.id, userStoryId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Add other user story related functions here:
// - createUserStory(data: NewUserStory)
// - updateUserStory(userStoryId: number, data: Partial<NewUserStory>)
// - deleteUserStory(userStoryId: number)
// - getUserStoriesBySprintId(sprintId: number)
