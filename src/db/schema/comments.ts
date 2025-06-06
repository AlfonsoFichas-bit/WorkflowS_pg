import {
  serial,
  text,
  integer,
  timestamp,
  pgTable,
} from "drizzle-orm/pg-core";

import { tasks } from "./tasks.ts";
import { users } from "./users.ts";

// Tabla de comentarios
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});