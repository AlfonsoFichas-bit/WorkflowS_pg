import {
  serial,
  varchar,
  text,
  integer,
  timestamp,
  pgTable,
} from "drizzle-orm/pg-core";

import { users } from "./users.ts";

// Tabla de rúbricas
export const rubrics = pgTable("rubrics", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  maxScore: integer("max_score").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabla de criterios de rúbrica
export const rubricCriteria = pgTable("rubric_criteria", {
  id: serial("id").primaryKey(),
  rubricId: integer("rubric_id").notNull().references(() => rubrics.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  weight: integer("weight").notNull().default(1),
  maxScore: integer("max_score").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});