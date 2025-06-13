import { Handlers } from "$fresh/server.ts";
import type { ApiState } from "./_middleware.ts";
import {
  createUserStory,
  getUserStoriesByProjectId,
  getProjectById, // Keep for validation if needed, or remove if not used by POST/GET list
  // deleteUserStory, getUserStoryById, updateUserStory, getSprintById, getAllUserStories, getUserStoriesBySprintId
} from "../../src/db/db.ts"; // Corrected import path
import { hasProjectPermission, getProjectUserRole } from "../../src/utils/permissions.ts";
import { PROJECT_OWNER, SCRUM_MASTER } from "../../types/roles.ts";
import type { UserStoryStatus, UserStoryPriority } from "../../types/userStory.ts";
import { userStories } from "../../src/db/schema/index.ts"; // For type inference

type NewUserStory = typeof userStories.$inferInsert;

export const handler: Handlers<unknown, ApiState> = {
  async POST(req, ctx) {
    // ctx.state.user.id is guaranteed by ApiState and middleware
    const currentUserId = ctx.state.user.id;

    try {
      const body = await req.json();
      const {
        title,
        description,
        acceptanceCriteria,
        projectId,
        sprintId, // Optional, can be null
        status, // Optional, schema has default
        priority, // Required by subtask prompt
        storyPoints,
      } = body;

      if (!title || !projectId || !priority) {
        return new Response(JSON.stringify({ error: "Missing required fields: title, projectId, priority" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Permission Check
      const canCreate = await hasProjectPermission(currentUserId, projectId, [PROJECT_OWNER, SCRUM_MASTER]);
      if (!canCreate) {
        return new Response(JSON.stringify({ error: "Forbidden: You don't have permission to create user stories for this project." }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Validate project existence (optional, but good practice)
      const project = await getProjectById(projectId);
      if (!project || project.length === 0) {
        return new Response(JSON.stringify({ error: "Project not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      // TODO: Validate sprintId if provided (similar to original code)

      const newUserStoryData: NewUserStory = {
        title,
        description,
        acceptanceCriteria,
        projectId,
        sprintId: sprintId || null, // Ensure null if not provided
        priority: priority as UserStoryPriority,
        storyPoints: storyPoints !== undefined && storyPoints !== null ? storyPoints : null,
      };
      // Status will be handled by schema default 'TODO' if not provided
      if (status) {
        newUserStoryData.status = status as UserStoryStatus;
      }


      const result = await createUserStory(newUserStoryData);

      return new Response(JSON.stringify({ success: true, userStory: result[0] }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al crear historia de usuario:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: "Error al crear la historia de usuario", details: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // PUT and DELETE will be moved to [id].ts
  // GET /api/user-stories?projectId=<projectId>
  async GET(req, ctx) {
    // ctx.state.user.id is guaranteed by ApiState and middleware
    const currentUserId = ctx.state.user.id;

    try {
      const url = new URL(req.url);
      // const id = url.searchParams.get("id"); // Will be handled by [id].ts
      const projectIdStr = url.searchParams.get("projectId");
      // const sprintId = url.searchParams.get("sprintId"); // Keep if filtering by sprintId here is desired

      if (projectIdStr) {
        const projectId = Number(projectIdStr);
        if (isNaN(projectId)) {
          return new Response(JSON.stringify({ error: "ID de proyecto inválido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Permission check: Any project member can view stories
        const userRoleInProject = await getProjectUserRole(currentUserId, projectId);
        if (!userRoleInProject) { // Includes PROJECT_OWNER, SCRUM_MASTER, DEVELOPER
          return new Response(JSON.stringify({ error: "Forbidden: You are not a member of this project." }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        const stories = await getUserStoriesByProjectId(projectId);
        return new Response(JSON.stringify({ success: true, userStories: stories }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Fallback or error if no projectId is provided for this endpoint
      return new Response(JSON.stringify({ error: "Missing projectId query parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Error al obtener historias de usuario:", error);
      return new Response(JSON.stringify({ error: "Error al obtener historias de usuario" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
};
