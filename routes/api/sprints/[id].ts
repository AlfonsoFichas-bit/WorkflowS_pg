import { Handlers } from "$fresh/server.ts";
import type { ApiState } from "../_middleware.ts";
import {
  getSprintById,
  updateSprint,
  deleteSprint,
  assignUserStoryToSprint, // For disassociating user stories on delete
} from "../../../src/db/db.ts";
import { hasProjectPermission, getProjectUserRole } from "../../../src/utils/permissions.ts";
import { PROJECT_OWNER, SCRUM_MASTER, DEVELOPER } from "../../../src/types/roles.ts";
import { SprintStatus } from "../../../src/types/sprint.ts";
import { sprints, userStories } from "../../../src/db/schema/index.ts"; // For type inference

type Sprint = typeof sprints.$inferSelect;
type SprintUpdate = Partial<Omit<Sprint, "id" | "createdAt" | "updatedAt" | "projectId">>;

export const handler: Handlers<Sprint | null, ApiState> = {
  // GET /api/sprints/:id
  async GET(_req, ctx) {
    const sprintId = Number.parseInt(ctx.params.id, 10);
    const currentUserId = ctx.state.user.id; // Guaranteed by ApiState

    if (Number.isNaN(sprintId)) {
      return new Response(JSON.stringify({ error: "Invalid sprint ID" }), { status: 400 });
    }
    // No need to check !currentUserId as middleware handles it

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

      return new Response(JSON.stringify({ success: true, sprint }), { status: 200 });
    } catch (error) {
      console.error("Error fetching sprint:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch sprint" }), { status: 500 });
    }
  },

  // PUT /api/sprints/:id
  async PUT(req, ctx) {
    const sprintId = Number.parseInt(ctx.params.id, 10);
    const currentUserId = ctx.state.user.id; // Guaranteed by ApiState

    if (Number.isNaN(sprintId)) {
      return new Response(JSON.stringify({ error: "Invalid sprint ID" }), { status: 400 });
    }
    // No need to check !currentUserId

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
    }

    const { name, description, startDate, endDate, status } = body;

    try {
      const sprintResult = await getSprintById(sprintId);
      if (!sprintResult || sprintResult.length === 0) {
        return new Response(JSON.stringify({ error: "Sprint not found" }), { status: 404 });
      }
      const sprint = sprintResult[0];

      const canUpdate = await hasProjectPermission(currentUserId, sprint.projectId, [PROJECT_OWNER, SCRUM_MASTER]);
      if (!canUpdate) {
        return new Response(JSON.stringify({ error: "Forbidden: You don't have permission to update sprints for this project." }), { status: 403 });
      }

      const updateData: SprintUpdate = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (startDate !== undefined) updateData.startDate = new Date(startDate);
      if (endDate !== undefined) updateData.endDate = new Date(endDate);
      if (status !== undefined) updateData.status = status as SprintStatus;

      if (updateData.startDate && updateData.endDate && new Date(updateData.endDate) <= new Date(updateData.startDate)) {
        return new Response(JSON.stringify({ error: "End date must be after start date" }), { status: 400 });
      } else if (updateData.startDate && !updateData.endDate && sprint.endDate <= new Date(updateData.startDate)) {
         return new Response(JSON.stringify({ error: "End date must be after start date" }), { status: 400 });
      } else if (!updateData.startDate && updateData.endDate && new Date(updateData.endDate) <= sprint.startDate) {
         return new Response(JSON.stringify({ error: "End date must be after start date" }), { status: 400 });
      }


      if (Object.keys(updateData).length === 0) {
        return new Response(JSON.stringify({ success: true, sprint }), { status: 200 });
      }

      const updatedSprintResult = await updateSprint(sprintId, updateData);
      return new Response(JSON.stringify({ success: true, sprint: updatedSprintResult[0] }), { status: 200 });
    } catch (error) {
      console.error("Error updating sprint:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: "Failed to update sprint", details: errorMessage }), { status: 500 });
    }
  },

  // DELETE /api/sprints/:id
  async DELETE(_req, ctx) {
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

      const canDelete = await hasProjectPermission(currentUserId, sprint.projectId, [PROJECT_OWNER, SCRUM_MASTER]);
      if (!canDelete) {
        return new Response(JSON.stringify({ error: "Forbidden: You don't have permission to delete sprints for this project." }), { status: 403 });
      }

      // The schema for userStories.sprintId is already `onDelete: 'set null'`.
      // So, when a sprint is deleted, all user stories associated with it will automatically have their sprintId set to null.
      // No explicit disassociation is needed here if hard deleting sprints.
      await deleteSprint(sprintId);

      return new Response(JSON.stringify({ success: true, message: "Sprint deleted successfully" }), { status: 200 }); // or 204
    } catch (error) {
      console.error("Error deleting sprint:", error);
      return new Response(JSON.stringify({ error: "Failed to delete sprint" }), { status: 500 });
    }
  },
};
