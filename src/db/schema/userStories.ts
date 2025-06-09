import {
  serial,
  varchar,
  text,
  integer,
  timestamp,
  pgTable,
} from "drizzle-orm/pg-core";

import { projects } from "./projects.ts";
import { sprints } from "./sprints.ts";

// Tabla de historias de usuario
export const userStories = pgTable("user_stories", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  acceptanceCriteria: text("acceptance_criteria"),
  projectId: integer("project_id").notNull().references(() => projects.id),
  sprintId: integer("sprint_id").references(() => sprints.id),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  priority: varchar("priority", { length: 50 }).notNull().default("medium"),
  storyPoints: integer("story_points"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});