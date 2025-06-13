import {
  serial,
  varchar,
  text,
  integer,
  timestamp,
  pgTable,
  pgEnum,
} from "drizzle-orm/pg-core";

import { projects } from "./projects.ts";
import { sprints } from "./sprints.ts";
import { USER_STORY_STATUSES, USER_STORY_PRIORITIES, TODO, MEDIUM } from "../../../src/types/userStory.ts";

// Enums for Drizzle
export const userStoryStatusEnum = pgEnum("user_story_status", USER_STORY_STATUSES);
export const userStoryPriorityEnum = pgEnum("user_story_priority", USER_STORY_PRIORITIES);

// Tabla de historias de usuario
export const userStories = pgTable("user_stories", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  acceptanceCriteria: text("acceptance_criteria"),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sprintId: integer("sprint_id").references(() => sprints.id, { onDelete: 'set null' }),
  status: userStoryStatusEnum("status").notNull().default(TODO),
  priority: userStoryPriorityEnum("priority").notNull().default(MEDIUM),
  storyPoints: integer("story_points"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});