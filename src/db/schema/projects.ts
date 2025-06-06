import {
  serial,
  varchar,
  text,
  integer,
  timestamp,
  pgTable,
} from "drizzle-orm/pg-core";

import { users } from "./users.ts";

// Tabla de proyectos
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});