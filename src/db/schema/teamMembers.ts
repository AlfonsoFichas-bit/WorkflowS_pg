import {
  serial,
  varchar,
  integer,
  timestamp,
  pgTable,
} from "drizzle-orm/pg-core";

import { teams } from "./teams.ts";
import { users } from "./users.ts";

// Tabla de miembros de equipo
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: varchar("role", { length: 50 }).notNull().default("team_member"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});