import { Handlers, State } from "$fresh/server.ts";
import {
  getUserStoryById,
  updateUserStory,
  deleteUserStory,
} from "../../../src/db/db.ts";
import { hasProjectPermission, getProjectUserRole } from "../../../src/utils/permissions.ts";
import { PROJECT_OWNER, SCRUM_MASTER, DEVELOPER } from "../../../src/types/roles.ts";
import type { UserStoryStatus, UserStoryPriority } from "../../../src/types/userStory.ts";
import { userStories } from "../../../src/db/schema/index.ts";

type UserStory = typeof userStories.$inferSelect;
type UserStoryUpdate = Partial<Omit<UserStory, "id" | "createdAt" | "updatedAt" | "projectId">>; // projectId should not be changed via this endpoint

export const handler: Handlers<UserStory | null, State> = {
  // GET /api/user-stories/:id (Get a single user story by ID)
  async GET(_req, ctx) {
    const userStoryId = parseInt(ctx.params.id, 10);
    const currentUserId = ctx.state.user?.id;

    if (isNaN(userStoryId)) {
      return new Response(JSON.stringify({ error: "Invalid user story ID" }), { status: 400 });
    }
    if (!currentUserId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
    }

    try {
      const storyResult = await getUserStoryById(userStoryId);
      if (!storyResult || storyResult.length === 0) {
        return new Response(JSON.stringify({ error: "User story not found" }), { status: 404 });
      }
      const story = storyResult[0];

      // Permission check: Any project member can view
      const userRoleInProject = await getProjectUserRole(currentUserId, story.projectId);
      if (!userRoleInProject) {
        return new Response(JSON.stringify({ error: "Forbidden: You are not a member of this project." }), { status: 403 });
      }

      return new Response(JSON.stringify(story), { status: 200 });
    } catch (error) {
      console.error("Error fetching user story:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch user story" }), { status: 500 });
    }
  },

  // PUT /api/user-stories/:id (Update a user story)
  async PUT(req, ctx) {
    const userStoryId = parseInt(ctx.params.id, 10);
    const currentUserId = ctx.state.user?.id;

    if (isNaN(userStoryId)) {
      return new Response(JSON.stringify({ error: "Invalid user story ID" }), { status: 400 });
    }
    if (!currentUserId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
    }

    const { title, description, acceptanceCriteria, sprintId, status, priority, storyPoints } = body;

    try {
      const storyResult = await getUserStoryById(userStoryId);
      if (!storyResult || storyResult.length === 0) {
        return new Response(JSON.stringify({ error: "User story not found" }), { status: 404 });
      }
      const story = storyResult[0];

      // Permission Check: PROJECT_OWNER or SCRUM_MASTER
      const canUpdate = await hasProjectPermission(currentUserId, story.projectId, [PROJECT_OWNER, SCRUM_MASTER]);
      if (!canUpdate) {
        return new Response(JSON.stringify({ error: "Forbidden: You don't have permission to update user stories for this project." }), { status: 403 });
      }

      const updateData: UserStoryUpdate = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (acceptanceCriteria !== undefined) updateData.acceptanceCriteria = acceptanceCriteria;
      if (sprintId !== undefined) updateData.sprintId = sprintId; // Can be null to remove from sprint
      if (status !== undefined) updateData.status = status as UserStoryStatus;
      if (priority !== undefined) updateData.priority = priority as UserStoryPriority;
      if (storyPoints !== undefined) updateData.storyPoints = storyPoints;

      if (Object.keys(updateData).length === 0) {
        return new Response(JSON.stringify({ message: "No fields to update", story }), { status: 200 });
      }

      // TODO: Validate sprintId if provided (belongs to the same project)

      const updatedStoryResult = await updateUserStory(userStoryId, updateData);
      return new Response(JSON.stringify(updatedStoryResult[0]), { status: 200 });
    } catch (error) {
      console.error("Error updating user story:", error);
      return new Response(JSON.stringify({ error: "Failed to update user story", details: error.message }), { status: 500 });
    }
  },

  // DELETE /api/user-stories/:id (Delete a user story)
  async DELETE(_req, ctx) {
    const userStoryId = parseInt(ctx.params.id, 10);
    const currentUserId = ctx.state.user?.id;

    if (isNaN(userStoryId)) {
      return new Response(JSON.stringify({ error: "Invalid user story ID" }), { status: 400 });
    }
    if (!currentUserId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
    }

    try {
      const storyResult = await getUserStoryById(userStoryId);
      if (!storyResult || storyResult.length === 0) {
        return new Response(JSON.stringify({ error: "User story not found" }), { status: 404 });
      }
      const story = storyResult[0];

      // Permission Check: PROJECT_OWNER or SCRUM_MASTER
      const canDelete = await hasProjectPermission(currentUserId, story.projectId, [PROJECT_OWNER, SCRUM_MASTER]);
      if (!canDelete) {
        return new Response(JSON.stringify({ error: "Forbidden: You don't have permission to delete user stories for this project." }), { status: 403 });
      }

      await deleteUserStory(userStoryId);
      return new Response(JSON.stringify({ message: "User story deleted successfully" }), { status: 200 }); // Or 204 No Content
    } catch (error) {
      console.error("Error deleting user story:", error);
      return new Response(JSON.stringify({ error: "Failed to delete user story" }), { status: 500 });
    }
  },
};
