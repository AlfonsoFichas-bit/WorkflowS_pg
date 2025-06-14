import { integer, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { milestones } from "./milestones";
import { userStories } from "./userStories";

export const milestoneUserStories = pgTable(
  "milestone_user_stories",
  {
    milestoneId: integer("milestone_id")
      .notNull()
      .references(() => milestones.id, { onDelete: "cascade" }),
    userStoryId: integer("user_story_id")
      .notNull()
      .references(() => userStories.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.milestoneId, table.userStoryId] }),
    };
  }
);
