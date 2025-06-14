import { Handlers } from "$fresh/server.ts";
import { Status } from "$std/http/status.ts";
import {
  getMilestoneById, // To check milestone existence and get projectId
  getUserStoriesByMilestoneId,
  linkUserStoriesToMilestone,
} from "../../../../src/db/queries/milestones.ts"; // Path relative to this new file
import type { UserStory } from "../../../../src/db/schema/userStories.ts";
import type { ApiState } from "../../_middleware.ts"; // Path relative to this new file
import { getProjectUserRole, hasProjectPermission } from "../../../../src/utils/permissions.ts"; // Path relative
import { PROJECT_OWNER } from "../../../../src/types/roles.ts"; // Path relative

export const handler: Handlers<any, ApiState> = {
  // GET /api/milestones/:milestoneId/user-stories
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
      // First, check if the milestone exists and get its project ID for permission check
      const milestone = await getMilestoneById(milestoneId);
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

      const userStoriesList = await getUserStoriesByMilestoneId(milestoneId);
      return new Response(JSON.stringify(userStoriesList), {
        status: Status.OK,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching user stories for milestone:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: Status.InternalServerError,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // POST /api/milestones/:milestoneId/user-stories
  async POST(req, ctx) {
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

    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userStoryIds = payload.userStoryIds;
    if (!Array.isArray(userStoryIds) || !userStoryIds.every(id => typeof id === 'number')) {
        return new Response(JSON.stringify({ error: "Invalid payload: userStoryIds must be an array of numbers." }), {
            status: Status.BadRequest,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
      await linkUserStoriesToMilestone(milestoneId, userStoryIds as number[]);
      const updatedUserStories = await getUserStoriesByMilestoneId(milestoneId);
      return new Response(JSON.stringify({
        message: "User stories linked successfully.",
        associatedUserStories: updatedUserStories
      }), {
        status: Status.OK,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error linking user stories to milestone:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: Status.InternalServerError,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
