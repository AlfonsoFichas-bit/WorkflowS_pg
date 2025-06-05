// Database schema definitions
// This file will export all schema definitions for the application

// This is a placeholder for the actual schema definitions
// It will be implemented according to the guide later

// Example schema structure (to be implemented with Drizzle ORM):
/*
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sprints = pgTable("sprints", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  name: text("name").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").default("planning"),
});
*/