import { Handlers } from "$fresh/server.ts";
import { Status } from "$std/http/status.ts";
import {
  getMilestoneById, // To check milestone existence and get projectId
  unlinkUserStoryFromMilestone,
} from "../../../../../src/db/queries/milestones.ts"; // Path relative to this new file
import type { ApiState } from "../../../_middleware.ts"; // Path relative
import { hasProjectPermission } from "../../../../../src/utils/permissions.ts"; // Path relative
import { PROJECT_OWNER } from "../../../../../src/types/roles.ts"; // Path relative

export const handler: Handlers<any, ApiState> = {
  // DELETE /api/milestones/:milestoneId/user-stories/:userStoryId
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
    const userStoryId = parseInt(ctx.params.userStoryId, 10);

    if (isNaN(milestoneId) || isNaN(userStoryId)) {
      return new Response(JSON.stringify({ error: "Invalid milestone ID or user story ID" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Check if milestone exists and get projectId for permissions
      const milestone = await getMilestoneById(milestoneId);
      if (!milestone || !milestone.projectId) {
        return new Response(JSON.stringify({ error: "Milestone not found" }), {
          status: Status.NotFound,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Permission check: User must be Project Owner
      const isProjectOwner = await hasProjectPermission(sessionUser.id, milestone.projectId, [PROJECT_OWNER]);
      if (!isProjectOwner) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: Status.Forbidden,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await unlinkUserStoryFromMilestone(milestoneId, userStoryId);

      if (result.rowCount === 0) {
        // This could mean the milestone-userstory link didn't exist, or one of the IDs was wrong.
        // It's not necessarily an error if the goal is "ensure this link doesn't exist".
        // However, for a specific DELETE, client might expect the link to have existed.
        return new Response(JSON.stringify({ error: "Link not found or already removed" }), {
            status: Status.NotFound,
            headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "User story unlinked successfully" }), {
        status: Status.OK, // Or 204 No Content if preferred
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error unlinking user story from milestone:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: Status.InternalServerError,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
