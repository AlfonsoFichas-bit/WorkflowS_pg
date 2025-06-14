import { Handlers } from "$fresh/server.ts";
import { Status } from "$std/http/status.ts";
import {
  getMilestoneById,
  getMilestoneWithDetails,
  updateMilestone,
  deleteMilestone,
} from "../../../src/db/queries/milestones.ts"; // Adjusted path
import type {
  Milestone,
  NewMilestone,
} from "../../../src/db/schema/milestones.ts"; // Adjusted path
import type { ApiState } from "../_middleware.ts"; // Adjusted path
import { getProjectUserRole, hasProjectPermission } from "../../../src/utils/permissions.ts"; // Adjusted path
import { PROJECT_OWNER, SCRUM_MASTER, DEVELOPER, type ProjectRole } from "../../../src/types/roles.ts"; // Adjusted path

export const handler: Handlers<any, ApiState> = {
  // GET /api/milestones/:milestoneId
  async GET(_req, ctx) {
    const state = ctx.state;
    const { sessionUser } = state;

    if (!sessionUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: Status.Unauthorized,
        headers: { "Content-Type": "application/json" },
      });
    }

    const milestoneId = parseInt(ctx.params.milestoneId, 10);
    if (isNaN(milestoneId)) {
      return new Response(JSON.stringify({ error: "Invalid milestone ID" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const milestone = await getMilestoneWithDetails(milestoneId); // Using with details

      if (!milestone || !milestone.projectId) {
        return new Response(JSON.stringify({ error: "Milestone not found" }), {
          status: Status.NotFound,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Permission check: User must be part of the project this milestone belongs to
      const userRole = await getProjectUserRole(sessionUser.id, milestone.projectId);
      if (!userRole) {
        return new Response(JSON.stringify({ error: "Forbidden. User not part of this project." }), {
            status: Status.Forbidden,
            headers: { "Content-Type": "application/json" },
        });
      }
      // Any role is fine for viewing a specific milestone if they are part of the project

      return new Response(JSON.stringify(milestone), {
        status: Status.OK,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching milestone:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: Status.InternalServerError,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // PUT /api/milestones/:milestoneId
  async PUT(req, ctx) {
    const state = ctx.state;
    const { sessionUser } = state;

    if (!sessionUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: Status.Unauthorized,
        headers: { "Content-Type": "application/json" },
      });
    }

    const milestoneId = parseInt(ctx.params.milestoneId, 10);
    if (isNaN(milestoneId)) {
      return new Response(JSON.stringify({ error: "Invalid milestone ID" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch existing milestone to check projectId for permissions
    const existingMilestone = await getMilestoneById(milestoneId);
    if (!existingMilestone || !existingMilestone.projectId) {
        return new Response(JSON.stringify({ error: "Milestone not found" }), {
            status: Status.NotFound,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Permission check: User must be Project Owner (admin/docente equivalent)
    const isProjectOwner = await hasProjectPermission(sessionUser.id, existingMilestone.projectId, [PROJECT_OWNER]);
    if (!isProjectOwner) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: Status.Forbidden,
        headers: { "Content-Type": "application/json" },
      });
    }

    let updateData;
    try {
      updateData = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Ensure projectId and creatorId are not changed via this endpoint
    delete updateData.projectId;
    delete updateData.creatorId;
    if (updateData.deadline) {
        updateData.deadline = new Date(updateData.deadline);
    }


    try {
      const updatedMilestones = await updateMilestone(milestoneId, updateData as Partial<NewMilestone>);
      if (updatedMilestones.length === 0) {
        // This might happen if the milestoneId was valid but was deleted just before update
        // or if .returning() didn't yield results for some other reason.
        return new Response(JSON.stringify({ error: "Milestone not found or update failed" }), {
            status: Status.NotFound,
            headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(updatedMilestones[0]), {
        status: Status.OK,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error updating milestone:", error);
      // Could be a validation error from DB (e.g. non-existent rubricId)
      // or other constraint violation.
      return new Response(JSON.stringify({ error: "Internal server error or invalid data" }), {
        status: Status.InternalServerError,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // DELETE /api/milestones/:milestoneId
  async DELETE(_req, ctx) {
    const state = ctx.state;
    const { sessionUser } = state;

    if (!sessionUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: Status.Unauthorized,
        headers: { "Content-Type": "application/json" },
      });
    }

    const milestoneId = parseInt(ctx.params.milestoneId, 10);
    if (isNaN(milestoneId)) {
      return new Response(JSON.stringify({ error: "Invalid milestone ID" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch existing milestone to check projectId for permissions
    const existingMilestone = await getMilestoneById(milestoneId);
    if (!existingMilestone || !existingMilestone.projectId) {
        return new Response(JSON.stringify({ error: "Milestone not found" }), {
            status: Status.NotFound,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Permission check: User must be Project Owner (admin/docente equivalent)
    const isProjectOwner = await hasProjectPermission(sessionUser.id, existingMilestone.projectId, [PROJECT_OWNER]);
    if (!isProjectOwner) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: Status.Forbidden,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const result = await deleteMilestone(milestoneId);
      if (result.rowCount === 0) {
         return new Response(JSON.stringify({ error: "Milestone not found" }), {
            status: Status.NotFound,
            headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ message: "Milestone deleted successfully" }), {
        status: Status.OK, // Or Status.NoContent (204) if no body is returned
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error deleting milestone:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: Status.InternalServerError,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
