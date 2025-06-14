import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { milestones } from "./milestones";
import { teams } from "./teams";

export const milestoneSubmissions = pgTable("milestone_submissions", {
  id: serial("id").primaryKey(),
  milestoneId: integer("milestone_id")
    .notNull()
    .references(() => milestones.id, { onDelete: "cascade" }),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  filePath: varchar("file_path", { length: 1024 }),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});
