import { Handlers } from "$fresh/server.ts";
import { Status } from "$std/http/status.ts";
import {
  createMilestone,
  getMilestonesByProjectId,
} from "../../../../src/db/queries/milestones.ts";
import type {
  Milestone,
  NewMilestone,
} from "../../../../src/db/schema/milestones.ts";
import type { ApiState } from "../../_middleware.ts";
import { getProjectUserRole, hasProjectPermission } from "../../../../src/utils/permissions.ts";
import { PROJECT_OWNER, SCRUM_MASTER, DEVELOPER, type ProjectRole } from "../../../../src/types/roles.ts"; // Assuming roles are defined here

export const handler: Handlers<any, ApiState> = {
  // POST /api/projects/:projectId/milestones
  async POST(req, ctx) {
    const state = ctx.state;
    const { sessionUser } = state;

    if (!sessionUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: Status.Unauthorized,
        headers: { "Content-Type": "application/json" },
      });
    }

    const projectId = parseInt(ctx.params.projectId, 10);
    if (isNaN(projectId)) {
      return new Response(JSON.stringify({ error: "Invalid project ID" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Permission check: User must be Project Owner (admin/docente equivalent)
    const isProjectOwner = await hasProjectPermission(sessionUser.id, projectId, [PROJECT_OWNER]);
    if (!isProjectOwner) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: Status.Forbidden,
        headers: { "Content-Type": "application/json" },
      });
    }

    let milestoneData;
    try {
      milestoneData = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (
      !milestoneData.name ||
      !milestoneData.deadline
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, deadline" }),
        {
          status: Status.BadRequest,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const newMilestone: NewMilestone = {
      projectId: projectId,
      creatorId: sessionUser.id,
      name: milestoneData.name,
      description: milestoneData.description, // optional
      deadline: new Date(milestoneData.deadline), // Ensure deadline is a Date object
      rubricId: milestoneData.rubricId, // optional
      status: milestoneData.status || "PENDING", // default if not provided
    };

    try {
      const createdMilestones = await createMilestone(newMilestone);
      if (createdMilestones.length === 0) {
        return new Response(
          JSON.stringify({ error: "Failed to create milestone" }),
          {
            status: Status.InternalServerError,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return new Response(JSON.stringify(createdMilestones[0]), {
        status: Status.Created,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error creating milestone:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: Status.InternalServerError,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },

  // GET /api/projects/:projectId/milestones
  async GET(_req, ctx) {
    const state = ctx.state;
    const { sessionUser } = state;

    if (!sessionUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: Status.Unauthorized,
        headers: { "Content-Type": "application/json" },
      });
    }

    const projectId = parseInt(ctx.params.projectId, 10);
    if (isNaN(projectId)) {
      return new Response(JSON.stringify({ error: "Invalid project ID" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Permission check: User must be part of the project
    const userRole = await getProjectUserRole(sessionUser.id, projectId);
    if (!userRole) {
        return new Response(JSON.stringify({ error: "Forbidden. User not part of this project." }), {
            status: Status.Forbidden,
            headers: { "Content-Type": "application/json" },
        });
    }
    // Any role is fine for listing milestones within a project they are part of
    // const canView = await hasProjectPermission(sessionUser.id, projectId, [PROJECT_OWNER, SCRUM_MASTER, DEVELOPER]);
    // if (!canView) { ... } // This check is implicitly covered by getProjectUserRole returning non-null

    try {
      const milestonesList = await getMilestonesByProjectId(projectId);
      return new Response(JSON.stringify(milestonesList), {
        status: Status.OK,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching milestones:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: Status.InternalServerError,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
