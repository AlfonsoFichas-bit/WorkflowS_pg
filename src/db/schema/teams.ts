import {
  serial,
  varchar,
  integer,
  timestamp,
  pgTable,
} from "drizzle-orm/pg-core";

import { projects } from "./projects.ts";

// Tabla de equipos
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});