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
import { SPRINT_STATUSES, PLANNED } from "../../types/sprint.ts";

// Enum for Drizzle
export const sprintStatusEnum = pgEnum("sprint_status", SPRINT_STATUSES);

// Tabla de sprints
export const sprints = pgTable("sprints", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: sprintStatusEnum("status").notNull().default(PLANNED),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});