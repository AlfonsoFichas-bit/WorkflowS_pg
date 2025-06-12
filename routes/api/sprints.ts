import { Handlers } from "$fresh/server.ts";
import type { ApiState } from "./_middleware.ts";
import {
  createSprint,
  getSprintsByProjectId,
  // getSprintById, // Will be in [id].ts
  // updateSprint, // Will be in [id].ts
  // deleteSprint, // Will be in [id].ts
  // getAllSprints, // Not required by current subtask for this endpoint
} from "../../src/db/db.ts";
import { hasProjectPermission, getProjectUserRole } from "../../utils/permissions.ts";
import { PROJECT_OWNER, SCRUM_MASTER, DEVELOPER } from "../../types/roles.ts";
import { PLANNED, SprintStatus } from "../../types/sprint.ts";
import { sprints } from "../../src/db/schema/index.ts"; // For type inference

type NewSprint = typeof sprints.$inferInsert;

export const handler: Handlers<unknown, ApiState> = {
  // POST /api/sprints (Create a new sprint)
  async POST(req, ctx) {
    // ctx.state.user.id is guaranteed by ApiState and middleware
    const currentUserId = ctx.state.user.id;

    try {
      const body = await req.json();
      const { name, description, projectId, startDate, endDate, status } = body;

      if (!name || !projectId || !startDate || !endDate) {
        return new Response(JSON.stringify({ error: "Missing required fields: name, projectId, startDate, endDate" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Permission Check
      const canCreate = await hasProjectPermission(currentUserId, projectId, [PROJECT_OWNER, SCRUM_MASTER]);
      if (!canCreate) {
        return new Response(JSON.stringify({ error: "Forbidden: You don't have permission to create sprints for this project." }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return new Response(JSON.stringify({ error: "La fecha de fin debe ser posterior a la fecha de inicio" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const newSprintData: NewSprint = {
        name,
        description,
        projectId,
        startDate: start,
        endDate: end,
        status: (status as SprintStatus) || PLANNED, // Use imported PLANNED
      };

      const result = await createSprint(newSprintData);

      return new Response(JSON.stringify({ success: true, sprint: result[0] }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al crear sprint:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: "Error al crear el sprint", details: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // GET /api/sprints?projectId=<projectId> (Get all sprints for a project)
  async GET(req, ctx) {
    // ctx.state.user.id is guaranteed by ApiState and middleware
    const currentUserId = ctx.state.user.id;

    try {
      const url = new URL(req.url);
      const projectIdStr = url.searchParams.get("projectId");

      if (!projectIdStr) {
        return new Response(JSON.stringify({ error: "Missing projectId query parameter" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const projectId = Number(projectIdStr);
      if (isNaN(projectId)) {
        return new Response(JSON.stringify({ error: "Invalid projectId" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Permission check: Any project member can view sprints
      const userRoleInProject = await getProjectUserRole(currentUserId, projectId);
      if (!userRoleInProject) { // Includes PROJECT_OWNER, SCRUM_MASTER, DEVELOPER
        return new Response(JSON.stringify({ error: "Forbidden: You are not a member of this project." }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const projectSprints = await getSprintsByProjectId(projectId);
      return new Response(JSON.stringify({ success: true, sprints: projectSprints }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al obtener sprints:", error);
      return new Response(JSON.stringify({ error: "Error al obtener sprints" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
