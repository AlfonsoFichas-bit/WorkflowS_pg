import {
  serial,
  varchar,
  text,
  integer,
  timestamp,
  pgTable,
} from "drizzle-orm/pg-core";

import { projects } from "./projects.ts";

// Tabla de sprints
export const sprints = pgTable("sprints", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  projectId: integer("project_id").notNull().references(() => projects.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("planned"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});