import { drizzle } from "drizzle-orm/node-postgres";
import { 
  users, 
  projects, 
  teams, 
  teamMembers, 
  sprints, 
  tasks, 
  comments, 
  evaluations 
} from "./schema/index.ts";
import { 
  usersRelations, 
  projectsRelations, 
  teamsRelations, 
  teamMembersRelations, 
  sprintsRelations, 
  tasksRelations, 
  commentsRelations, 
  evaluationsRelations 
} from "./relations.ts";
import pg from "pg";
import { eq } from "drizzle-orm";

const { Pool } = pg;

// Crear el pool de conexiones
const pool = new Pool({
  connectionString: Deno.env.get("DATABASE_URL"),
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
    usersRelations,
    projectsRelations,
    teamsRelations,
    teamMembersRelations,
    sprintsRelations,
    tasksRelations,
    commentsRelations,
    evaluationsRelations
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