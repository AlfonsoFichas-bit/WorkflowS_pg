import {
  serial,
  varchar,
  timestamp,
  pgTable,
} from "drizzle-orm/pg-core";

// Tabla de usuarios
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  paternalLastName: varchar("paternal_last_name", { length: 255 }).default(""),
  maternalLastName: varchar("maternal_last_name", { length: 255 }).default(""),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("team_developer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});