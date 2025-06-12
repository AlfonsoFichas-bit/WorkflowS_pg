import { drizzle } from "drizzle-orm/node-postgres";
import { 
  users, 
  projects, 
  teams, 
  teamMembers, 
  sprints, 
  tasks, 
  comments, 
  evaluations,
  userStories,
  rubrics,
  rubricCriteria
} from "./schema/index.ts";
import { 
  usersRelations, 
  projectsRelations, 
  teamsRelations, 
  teamMembersRelations, 
  sprintsRelations, 
  tasksRelations, 
  commentsRelations, 
  evaluationsRelations,
  userStoriesRelations,
  rubricsRelations,
  rubricCriteriaRelations
} from "./relations.ts";
import pg from "pg";
import { eq, leftJoin } from "drizzle-orm"; // Added leftJoin here

const { Pool } = pg;

// Importar la configuración de la base de datos
import { databaseConfig } from "../config/database.ts";

// Crear el pool de conexiones
const pool = new Pool({
  connectionString: databaseConfig.connectionString,
  ssl: true, // Siempre habilitar SSL para Neon Tech
});

// Crear la instancia de drizzle
export const db = drizzle(pool, {
  schema: {
    users,
    projects,
    teams,
    teamMembers,
    sprints,
    tasks,
    comments,
    evaluations,
    userStories,
    rubrics,
    rubricCriteria,
    usersRelations,
    projectsRelations,
    teamsRelations,
    teamMembersRelations,
    sprintsRelations,
    tasksRelations,
    commentsRelations,
    evaluationsRelations,
    userStoriesRelations,
    rubricsRelations,
    rubricCriteriaRelations
  },
});

// Servicios de usuario
export async function createUser(userData: Omit<typeof users.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  return await db.insert(users).values(userData).returning();
}

export async function getUserById(id: number) {
  return await db.select().from(users).where(eq(users.id, id)).limit(1);
}

export async function getUserByEmail(email: string) {
  return await db.select().from(users).where(eq(users.email, email));
}

export async function getAllUsers() {
  return await db.select().from(users);
}

export async function getAllUsersWithTeamMemberships() {
  // First get all users
  const allUsers = await getAllUsers();

  // Then get team memberships for each user
  const usersWithMemberships = await Promise.all(
    allUsers.map(async (user) => {
      const memberships = await getTeamMembersByUserId(user.id);

      // Get team and project details for each membership
      const membershipsWithDetails = await Promise.all(
        memberships.map(async (membership) => {
          const team = await getTeamById(membership.teamId);
          let project = null;

          if (team && team.length > 0) {
            const projectResult = await getProjectById(team[0].projectId);
            if (projectResult && projectResult.length > 0) {
              project = projectResult[0];
            }
          }

          return {
            ...membership,
            team: team && team.length > 0 ? team[0] : null,
            project: project,
          };
        })
      );

      return {
        ...user,
        teamMemberships: membershipsWithDetails,
      };
    })
  );

  return usersWithMemberships;
}

export async function updateUser(id: number, userData: Partial<Omit<typeof users.$inferInsert, "id" | "createdAt" | "updatedAt">>) {
  return await db.update(users)
    .set({
      ...userData,
      updatedAt: new Date()
    })
    .where(eq(users.id, id))
    .returning();
}

export async function deleteUser(id: number) {
  return await db.delete(users)
    .where(eq(users.id, id))
    .returning();
}

// Servicios de proyecto
export async function createProject(projectData: Omit<typeof projects.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  return await db.insert(projects).values(projectData).returning();
}

export async function getProjectById(id: number) {
  return await db.select().from(projects).where(eq(projects.id, id)).limit(1);
}

export async function getAllProjects() {
  return await db.select().from(projects);
}

export async function getProjectsByOwnerId(ownerId: number) {
  return await db.select().from(projects).where(eq(projects.ownerId, ownerId));
}

export async function updateProject(id: number, projectData: Partial<Omit<typeof projects.$inferInsert, "id" | "createdAt" | "updatedAt">>) {
  return await db.update(projects).set({
    ...projectData,
    updatedAt: new Date()
  }).where(eq(projects.id, id)).returning();
}

export async function deleteProject(id: number) {
  // First, get all teams associated with this project
  const projectTeams = await getTeamsByProjectId(id);

  // Delete all team members for each team
  for (const team of projectTeams) {
    await db.delete(teamMembers).where(eq(teamMembers.teamId, team.id));
  }

  // Delete all teams associated with this project
  await db.delete(teams).where(eq(teams.projectId, id));

  // Now we can safely delete the project
  return await db.delete(projects).where(eq(projects.id, id)).returning();
}

// Servicios de equipo
export async function createTeam(teamData: Omit<typeof teams.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  return await db.insert(teams).values(teamData).returning();
}

export async function getTeamById(id: number) {
  return await db.select().from(teams).where(eq(teams.id, id)).limit(1);
}

export async function getTeamsByProjectId(projectId: number) {
  return await db.select().from(teams).where(eq(teams.projectId, projectId));
}

export async function getAllTeams() {
  return await db.select().from(teams);
}

export async function updateTeam(id: number, teamData: Partial<Omit<typeof teams.$inferInsert, "id" | "createdAt" | "updatedAt">>) {
  return await db.update(teams).set({
    ...teamData,
    updatedAt: new Date()
  }).where(eq(teams.id, id)).returning();
}

export async function deleteTeam(id: number) {
  return await db.delete(teams).where(eq(teams.id, id)).returning();
}

// Servicios de miembros de equipo
export async function createTeamMember(teamMemberData: Omit<typeof teamMembers.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  return await db.insert(teamMembers).values(teamMemberData).returning();
}

export async function getTeamMemberById(id: number) {
  return await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
}

export async function getTeamMembersByTeamId(teamId: number) {
  return await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
}

export async function getTeamMembersByUserId(userId: number) {
  return await db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
}

export async function updateTeamMember(id: number, teamMemberData: Partial<Omit<typeof teamMembers.$inferInsert, "id" | "createdAt" | "updatedAt">>) {
  return await db.update(teamMembers).set({
    ...teamMemberData,
    updatedAt: new Date()
  }).where(eq(teamMembers.id, id)).returning();
}

export async function deleteTeamMember(id: number) {
  return await db.delete(teamMembers).where(eq(teamMembers.id, id)).returning();
}

export async function deleteTeamMembersByUserId(userId: number) {
  return await db.delete(teamMembers).where(eq(teamMembers.userId, userId)).returning();
}

// Función para obtener los miembros de un proyecto
export async function getProjectMembers(projectId: number) {
  // Primero obtenemos los equipos del proyecto
  const projectTeams = await getTeamsByProjectId(projectId);

  if (!projectTeams || projectTeams.length === 0) {
    return [];
  }

  // Obtenemos los IDs de los equipos
  const teamIds = projectTeams.map(team => team.id);

  // Obtenemos los miembros de todos los equipos del proyecto
  const members = [];
  for (const teamId of teamIds) {
    const teamMembersResult = await db.select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      teamId: teamMembers.teamId,
      role: teamMembers.role,
      user: users
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId));

    members.push(...teamMembersResult);
  }

  return members;
}

// Servicios de tarea
export async function createTask(taskData: Omit<typeof tasks.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  return await db.insert(tasks).values(taskData).returning();
}

export async function getTaskById(id: number) {
  return await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
}

export async function getTasksBySprintId(sprintId: number) {
  return await db.select().from(tasks).where(eq(tasks.sprintId, sprintId));
}

export async function getTasksByAssigneeId(assigneeId: number) {
  return await db.select().from(tasks).where(eq(tasks.assigneeId, assigneeId));
}

export async function getAllTasks() {
  return await db.select().from(tasks);
}

export async function updateTask(id: number, taskData: Partial<Omit<typeof tasks.$inferInsert, "id" | "createdAt" | "updatedAt">>) {
  return await db.update(tasks).set({
    ...taskData,
    updatedAt: new Date()
  }).where(eq(tasks.id, id)).returning();
}

export async function deleteTask(id: number) {
  return await db.delete(tasks).where(eq(tasks.id, id)).returning();
}

// Servicios de sprint
export async function createSprint(sprintData: Omit<typeof sprints.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  return await db.insert(sprints).values(sprintData).returning();
}

export async function getSprintById(id: number) {
  return await db.select().from(sprints).where(eq(sprints.id, id)).limit(1);
}

export async function getSprintsByProjectId(projectId: number) {
  return await db.select().from(sprints).where(eq(sprints.projectId, projectId));
}

export async function getAllSprints() {
  return await db.select().from(sprints);
}

export async function updateSprint(id: number, sprintData: Partial<Omit<typeof sprints.$inferInsert, "id" | "createdAt" | "updatedAt">>) {
  return await db.update(sprints).set({
    ...sprintData,
    updatedAt: new Date()
  }).where(eq(sprints.id, id)).returning();
}

export async function deleteSprint(id: number) {
  return await db.delete(sprints).where(eq(sprints.id, id)).returning();
}

// Servicios de historias de usuario
export async function createUserStory(userStoryData: Omit<typeof userStories.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  return await db.insert(userStories).values(userStoryData).returning();
}

export async function getUserStoryById(id: number) {
  return await db.select().from(userStories).where(eq(userStories.id, id)).limit(1);
// Removed incorrect leftJoin import from here
}

export async function getUserStoriesByProjectId(projectId: number) {
  return await db
    .select({
      ...userStories, // Select all fields from userStories
      sprintName: sprints.name, // Select the sprint name
    })
    .from(userStories)
    .leftJoin(sprints, eq(userStories.sprintId, sprints.id))
    .where(eq(userStories.projectId, projectId));
}

export async function getUserStoriesBySprintId(sprintId: number) {
  return await db
    .select({
      ...userStories,
      sprintName: sprints.name,
    })
    .from(userStories)
    .leftJoin(sprints, eq(userStories.sprintId, sprints.id))
    .where(eq(userStories.sprintId, sprintId));
}

export async function getAllUserStories() {
  return await db.select().from(userStories);
}

export async function updateUserStory(id: number, userStoryData: Partial<Omit<typeof userStories.$inferInsert, "id" | "createdAt" | "updatedAt">>) {
  return await db.update(userStories).set({
    ...userStoryData,
    updatedAt: new Date()
  }).where(eq(userStories.id, id)).returning();
}

export async function deleteUserStory(id: number) {
  return await db.delete(userStories).where(eq(userStories.id, id)).returning();
}

export async function assignUserStoryToSprint(userStoryId: number, sprintId: number | null) {
  return await db.update(userStories)
    .set({ sprintId: sprintId, updatedAt: new Date() })
    .where(eq(userStories.id, userStoryId))
    .returning();
}

// Servicios de rúbricas
export async function createRubric(rubricData: Omit<typeof rubrics.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  return await db.insert(rubrics).values(rubricData).returning();
}

export async function getRubricById(id: number) {
  return await db.select().from(rubrics).where(eq(rubrics.id, id)).limit(1);
}

export async function getRubricsByCreatorId(creatorId: number) {
  return await db.select().from(rubrics).where(eq(rubrics.creatorId, creatorId));
}

export async function getAllRubrics() {
  return await db.select().from(rubrics);
}

export async function updateRubric(id: number, rubricData: Partial<Omit<typeof rubrics.$inferInsert, "id" | "createdAt" | "updatedAt">>) {
  return await db.update(rubrics).set({
    ...rubricData,
    updatedAt: new Date()
  }).where(eq(rubrics.id, id)).returning();
}

export async function deleteRubric(id: number) {
  return await db.delete(rubrics).where(eq(rubrics.id, id)).returning();
}

// Servicios de criterios de rúbrica
export async function createRubricCriterion(criterionData: Omit<typeof rubricCriteria.$inferInsert, "id" | "createdAt" | "updatedAt">) {
  return await db.insert(rubricCriteria).values(criterionData).returning();
}

export async function getRubricCriterionById(id: number) {
  return await db.select().from(rubricCriteria).where(eq(rubricCriteria.id, id)).limit(1);
}

export async function getRubricCriteriaByRubricId(rubricId: number) {
  return await db.select().from(rubricCriteria).where(eq(rubricCriteria.rubricId, rubricId));
}

export async function updateRubricCriterion(id: number, criterionData: Partial<Omit<typeof rubricCriteria.$inferInsert, "id" | "createdAt" | "updatedAt">>) {
  return await db.update(rubricCriteria).set({
    ...criterionData,
    updatedAt: new Date()
  }).where(eq(rubricCriteria.id, id)).returning();
}

export async function deleteRubricCriterion(id: number) {
  return await db.delete(rubricCriteria).where(eq(rubricCriteria.id, id)).returning();
}

// Helper function to test the database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("Successfully connected to PostgreSQL");
    client.release();
    return true;
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error);
    return false;
  }
}

// Close the pool (call this when shutting down the application)
export async function closePool() {
  await pool.end();
}
