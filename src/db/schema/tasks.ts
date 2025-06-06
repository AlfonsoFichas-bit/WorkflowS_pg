import {
  serial,
  varchar,
  text,
  integer,
  timestamp,
  pgTable,
} from "drizzle-orm/pg-core";

import { sprints } from "./sprints.ts";
import { users } from "./users.ts";

// Tabla de tareas
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  sprintId: integer("sprint_id").references(() => sprints.id),
  assigneeId: integer("assignee_id").references(() => users.id),
  status: varchar("status", { length: 50 }).notNull().default("todo"),
  priority: varchar("priority", { length: 50 }).notNull().default("medium"),
  storyPoints: integer("story_points"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});