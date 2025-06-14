import { eq } from "drizzle-orm";
import { db } from "../db";
import { projects, type Project } from "../schema/projects";
import { users, type User } from "../schema/users"; // For owner details

// Re-export types if not directly exported from schema or for consolidated access
export type { Project, User };

export type ProjectWithRelations = Project & {
  owner?: User | null; // Owner might be optional or could be fetched separately
};

/**
 * Retrieves a project by its ID, including owner information.
 * @param projectId The ID of the project to retrieve.
 * @returns The project details with owner information, or undefined if not found.
 */
export async function getProjectById(
  projectId: number
): Promise<ProjectWithRelations | undefined> {
  const result = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      ownerId: projects.ownerId,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      owner: {
        // Select specific fields from the user table for the owner
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        // Add other user fields if needed, but avoid sensitive data like passwordHash
      },
    })
    .from(projects)
    .leftJoin(users, eq(projects.ownerId, users.id))
    .where(eq(projects.id, projectId))
    .limit(1);

  if (result.length === 0) {
    return undefined;
  }

  // The result from Drizzle with a joined object like 'owner' will be structured.
  // Drizzle will return an array of objects, each potentially having a nested 'owner' object.
  // Since we limit to 1, we take the first element.
  const projectData = result[0];

  return {
    id: projectData.id,
    name: projectData.name,
    description: projectData.description,
    ownerId: projectData.ownerId,
    createdAt: projectData.createdAt,
    updatedAt: projectData.updatedAt,
    owner: projectData.owner ? { // Ensure owner is not null before spreading
        id: projectData.owner.id,
        fullName: projectData.owner.fullName,
        email: projectData.owner.email,
        // Map other fields if selected, ensuring to handle potential null owner if leftJoin was used without an actual owner
    } : null,
  };
}

/**
 * Retrieves all projects.
 * Potentially extend this to include owner info or filter by user, etc.
 * @returns A list of all projects.
 */
export async function getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
}

// Add other project-related query functions here if needed, e.g.:
// - getProjectsByUserId(userId: number)
// - createProject(data: NewProject)
// - updateProject(projectId: number, data: Partial<NewProject>)
// - deleteProject(projectId: number)
