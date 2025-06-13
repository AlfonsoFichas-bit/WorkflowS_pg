import {
  serial,
  varchar,
  integer,
  timestamp,
  pgTable,
  pgEnum,
} from "drizzle-orm/pg-core";

import { PROJECT_ROLES } from "../../../src/types/roles.ts";
import { teams } from "./teams.ts";
import { users } from "./users.ts";

// Tabla de miembros de equipo
export const projectRolesEnum = pgEnum("project_roles", PROJECT_ROLES);

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: projectRolesEnum("role").notNull().default("DEVELOPER"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});