import { relations } from "drizzle-orm";
import { 
  users, 
  projects, 
  teams, 
  teamMembers, 
  sprints, 
  tasks, 
  comments, 
  evaluations 
} from "./schema.ts";

// Relaciones de usuarios
export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects, { relationName: "owner" }),
  teamMemberships: many(teamMembers),
  assignedTasks: many(tasks, { relationName: "assignee" }),
  comments: many(comments),
  evaluations: many(evaluations, { relationName: "evaluator" }),
}));

// Relaciones de proyectos
export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
    relationName: "owner",
  }),
  teams: many(teams),
  sprints: many(sprints),
  evaluations: many(evaluations),
}));

// Relaciones de equipos
export const teamsRelations = relations(teams, ({ one, many }) => ({
  project: one(projects, {
    fields: [teams.projectId],
    references: [projects.id],
  }),
  members: many(teamMembers),
  evaluations: many(evaluations),
}));

// Relaciones de miembros de equipo
export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

// Relaciones de sprints
export const sprintsRelations = relations(sprints, ({ one, many }) => ({
  project: one(projects, {
    fields: [sprints.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
}));

// Relaciones de tareas
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  sprint: one(sprints, {
    fields: [tasks.sprintId],
    references: [sprints.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: "assignee",
  }),
  comments: many(comments),
}));

// Relaciones de comentarios
export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

// Relaciones de evaluaciones
export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  project: one(projects, {
    fields: [evaluations.projectId],
    references: [projects.id],
  }),
  team: one(teams, {
    fields: [evaluations.teamId],
    references: [teams.id],
  }),
  evaluator: one(users, {
    fields: [evaluations.evaluatorId],
    references: [users.id],
    relationName: "evaluator",
  }),
}));