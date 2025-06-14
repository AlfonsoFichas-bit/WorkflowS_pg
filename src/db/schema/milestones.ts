import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";
import { rubrics } from "./rubrics";

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  deadline: timestamp("deadline").notNull(),
  rubricId: integer("rubric_id").references(() => rubrics.id, { onDelete: "set null" }),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
