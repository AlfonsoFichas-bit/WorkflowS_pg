import {
  serial,
  text,
  integer,
  timestamp,
  pgTable,
} from "drizzle-orm/pg-core";

import { projects } from "./projects.ts";
import { teams } from "./teams.ts";
import { users } from "./users.ts";

// Tabla de evaluaciones
export const evaluations = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  teamId: integer("team_id").notNull().references(() => teams.id),
  evaluatorId: integer("evaluator_id").notNull().references(() => users.id),
  score: integer("score").notNull(),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});