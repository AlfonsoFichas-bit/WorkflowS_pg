import { db } from "../db/index.ts";
import { projects } from "../db/schema/projects.ts";
import { teamMembers } from "../db/schema/teamMembers.ts";
import { teams } from "../db/schema/teams.ts";
import { eq, and } from "drizzle-orm";
import { PROJECT_OWNER, ProjectRole } from "../types/roles.ts";

/**
 * Retrieves the role of a user in a specific project.
 *
 * @param userId - The ID of the user.
 * @param projectId - The ID of the project.
 * @returns The user's role in the project (e.g., PROJECT_OWNER, SCRUM_MASTER, DEVELOPER)
 *          or null if the user is not part of the project or has no specific role.
 */
export async function getProjectUserRole(
  userId: number,
  projectId: number,
): Promise<ProjectRole | null> {
  try {
    // Check if the user is the project owner
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)
      .execute();

    if (project.length > 0 && project[0].ownerId === userId) {
      return PROJECT_OWNER;
    }

    // If not the owner, check teamMembers table
    const memberRole = await db
      .select({ role: teamMembers.role })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(and(eq(teams.projectId, projectId), eq(teamMembers.userId, userId)))
      .limit(1)
      .execute();

    if (memberRole.length > 0) {
      return memberRole[0].role as ProjectRole;
    }

    return null;
  } catch (error) {
    console.error("Error in getProjectUserRole:", error);
    return null; // Or throw the error, depending on desired error handling
  }
}

/**
 * Checks if a user has the required role(s) for a specific project.
 *
 * @param userId - The ID of the user.
 * @param projectId - The ID of the project.
 * @param requiredRoles - An array of roles, one of which the user must have.
 * @returns True if the user has one of the required roles, false otherwise.
 */
export async function hasProjectPermission(
  userId: number,
  projectId: number,
  requiredRoles: ProjectRole[],
): Promise<boolean> {
  if (!userId || !projectId) {
    return false;
  }
  const userRole = await getProjectUserRole(userId, projectId);
  if (userRole && requiredRoles.includes(userRole)) {
    return true;
  }
  return false;
}

/**
 * Retrieves the team membership (teamId and role) of a user in a specific project.
 * Project Owners do not have a teamId via teamMembers table in this model, so returns null for them for teamId.
 *
 * @param userId - The ID of the user.
 * @param projectId - The ID of the project.
 * @returns An object containing teamId and role, or null if not a team member or project owner.
 */
export async function getUserTeamMembershipInProject(
  userId: number,
  projectId: number,
): Promise<{ teamId: number | null; role: ProjectRole } | null> {
  try {
    const project = await db
      .select({ ownerId: projects.ownerId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length > 0 && project[0].ownerId === userId) {
      return { teamId: null, role: PROJECT_OWNER }; // Project owner isn't in a team via team_members
    }

    const membership = await db
      .select({ teamId: teamMembers.teamId, role: teamMembers.role })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(and(eq(teams.projectId, projectId), eq(teamMembers.userId, userId)))
      .limit(1);

    if (membership.length > 0) {
      return { teamId: membership[0].teamId, role: membership[0].role as ProjectRole };
    }

    return null;
  } catch (error) {
    console.error("Error in getUserTeamMembershipInProject:", error);
    return null;
  }
}
