import { Handlers } from "$fresh/server.ts";
import type { ApiState } from "../../_middleware.ts";
import {
  getSprintById,
  assignUserStoryToSprint,
  getUserStoriesBySprintId,
  getUserStoryById, // To verify user story exists and belongs to the correct project
} from "../../../../src/db/db.ts";
import { hasProjectPermission, getProjectUserRole } from "../../../../src/utils/permissions.ts";
import { PROJECT_OWNER, SCRUM_MASTER } from "../../../../src/types/roles.ts";
import { userStories } from "../../../../src/db/schema/index.ts";

type UserStory = typeof userStories.$inferSelect;

export const handler: Handlers<UserStory[] | UserStory | null, ApiState> = {
  // GET /api/sprints/:id/user-stories (Get all user stories for this sprint)
  async GET(_req, ctx) {
    const sprintId = Number.parseInt(ctx.params.id, 10);
    const currentUserId = ctx.state.user.id; // Guaranteed by ApiState

    if (Number.isNaN(sprintId)) {
      return new Response(JSON.stringify({ error: "Invalid sprint ID" }), { status: 400 });
    }
    // No need to check !currentUserId

    try {
      const sprintResult = await getSprintById(sprintId);
      if (!sprintResult || sprintResult.length === 0) {
        return new Response(JSON.stringify({ error: "Sprint not found" }), { status: 404 });
      }
      const sprint = sprintResult[0];

      const userRoleInProject = await getProjectUserRole(currentUserId, sprint.projectId);
      if (!userRoleInProject) {
        return new Response(JSON.stringify({ error: "Forbidden: You are not a member of this project." }), { status: 403 });
      }

      const stories = await getUserStoriesBySprintId(sprintId);
      return new Response(JSON.stringify({ success: true, userStories: stories }), { status: 200 });
    } catch (error) {
      console.error("Error fetching user stories for sprint:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch user stories for sprint" }), { status: 500 });
    }
  },

  // POST /api/sprints/:id/user-stories (Assign a user story to this sprint)
  async POST(req, ctx) {
    const sprintId = Number.parseInt(ctx.params.id, 10);
    const currentUserId = ctx.state.user.id; // Guaranteed by ApiState

    if (Number.isNaN(sprintId)) {
      return new Response(JSON.stringify({ error: "Invalid sprint ID" }), { status: 400 });
    }
    // No need to check !currentUserId

    let body;
    try {
      body = await req.json();
    } catch (_e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
    }
    const { userStoryId } = body;

    if (!userStoryId || Number.isNaN(Number(userStoryId))) {
      return new Response(JSON.stringify({ error: "Missing or invalid userStoryId" }), { status: 400 });
    }

    try {
      const sprintResult = await getSprintById(sprintId);
      if (!sprintResult || sprintResult.length === 0) {
        return new Response(JSON.stringify({ error: "Sprint not found" }), { status: 404 });
      }
      const sprint = sprintResult[0];

      const canManage = await hasProjectPermission(currentUserId, sprint.projectId, [PROJECT_OWNER, SCRUM_MASTER]);
      if (!canManage) {
        return new Response(JSON.stringify({ error: "Forbidden: You don't have permission to manage user stories for this sprint." }), { status: 403 });
      }

      // Verify user story exists and belongs to the same project as the sprint
      const storyResult = await getUserStoryById(userStoryId);
      if (!storyResult || storyResult.length === 0) {
        return new Response(JSON.stringify({ error: "User story not found" }), { status: 404 });
      }
      if (storyResult[0].projectId !== sprint.projectId) {
        return new Response(JSON.stringify({ error: "User story does not belong to the same project as the sprint." }), { status: 400 });
      }

      const updatedStoryResult = await assignUserStoryToSprint(userStoryId, sprintId);
      return new Response(JSON.stringify({ success: true, userStory: updatedStoryResult[0] }), { status: 200 });
    } catch (error) {
      console.error("Error assigning user story to sprint:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: "Failed to assign user story to sprint", details: errorMessage }), { status: 500 });
    }
  },

  // DELETE /api/sprints/:id/user-stories/:userStoryId (Remove user story from sprint)
  async DELETE(_req, ctx) {
    const sprintId = Number.parseInt(ctx.params.id, 10);
    // Note: Fresh's router automatically decodes URI components for params.
    const userStoryIdParam = ctx.params.userStoryId;
    const userStoryId = Number.parseInt(userStoryIdParam, 10);
    const currentUserId = ctx.state.user.id; // Guaranteed by ApiState

    if (Number.isNaN(sprintId)) {
        return new Response(JSON.stringify({ error: "Invalid sprint ID" }), { status: 400 });
    }
    if (Number.isNaN(userStoryId)) {
        return new Response(JSON.stringify({ error: "Invalid user story ID" }), { status: 400 });
    }
    // No need to check !currentUserId

    try {
        const sprintResult = await getSprintById(sprintId);
        if (!sprintResult || sprintResult.length === 0) {
            return new Response(JSON.stringify({ error: "Sprint not found" }), { status: 404 });
        }
        const sprint = sprintResult[0];

        const canManage = await hasProjectPermission(currentUserId, sprint.projectId, [PROJECT_OWNER, SCRUM_MASTER]);
        if (!canManage) {
            return new Response(JSON.stringify({ error: "Forbidden: You don't have permission to manage user stories for this sprint." }), { status: 403 });
        }

        const storyResult = await getUserStoryById(userStoryId);
        if (!storyResult || storyResult.length === 0) {
            return new Response(JSON.stringify({ error: "User story not found" }), { status: 404 });
        }
        // Ensure the story actually belongs to this sprint before "removing"
        if (storyResult[0].sprintId !== sprintId) {
             return new Response(JSON.stringify({ error: "User story is not assigned to this sprint." }), { status: 400 });
        }

        const updatedStoryResult = await assignUserStoryToSprint(userStoryId, null); // Set sprintId to null
        return new Response(JSON.stringify({ success: true, userStory: updatedStoryResult[0] }), { status: 200 });

    } catch (error) {
        console.error("Error removing user story from sprint:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: "Failed to remove user story from sprint", details: errorMessage }), { status: 500 });
    }
  }
};
