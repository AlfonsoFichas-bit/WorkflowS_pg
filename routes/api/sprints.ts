import { Handlers } from "$fresh/server.ts";
import { createSprint, deleteSprint, getSprintById, updateSprint, getAllSprints, getSprintsByProjectId } from "../../utils/db.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { name, description, projectId, startDate, endDate, status } = body;

      // Validar datos
      if (!name) {
        return new Response(JSON.stringify({ error: "El nombre del sprint es obligatorio" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!projectId) {
        return new Response(JSON.stringify({ error: "El ID del proyecto es obligatorio" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!startDate || !endDate) {
        return new Response(JSON.stringify({ error: "Las fechas de inicio y fin son obligatorias" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Validar que la fecha de fin sea posterior a la de inicio
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return new Response(JSON.stringify({ error: "La fecha de fin debe ser posterior a la fecha de inicio" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Crear el sprint
      const newSprint = await createSprint({
        name,
        description,
        projectId,
        startDate: start,
        endDate: end,
        status: status || "planned",
      });

      return new Response(JSON.stringify({ success: true, sprint: newSprint[0] }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al crear sprint:", error);
      return new Response(JSON.stringify({ error: "Error al crear el sprint" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async PUT(req) {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (!id || isNaN(Number(id))) {
        return new Response(JSON.stringify({ error: "ID de sprint inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const sprintId = Number(id);

      // Verificar que el sprint existe
      const sprint = await getSprintById(sprintId);
      if (!sprint || sprint.length === 0) {
        return new Response(JSON.stringify({ error: "Sprint no encontrado" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { name, description, projectId, startDate, endDate, status } = body;

      // Preparar datos para actualización
      const updateData: Record<string, unknown> = {};

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (projectId !== undefined) updateData.projectId = projectId;
      if (startDate !== undefined) updateData.startDate = new Date(startDate);
      if (endDate !== undefined) updateData.endDate = new Date(endDate);
      if (status !== undefined) updateData.status = status;

      // Validar fechas si ambas están presentes
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end <= start) {
          return new Response(JSON.stringify({ error: "La fecha de fin debe ser posterior a la fecha de inicio" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Actualizar el sprint
      const updatedSprint = await updateSprint(sprintId, updateData);

      return new Response(JSON.stringify({ success: true, sprint: updatedSprint[0] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al actualizar sprint:", error);
      return new Response(JSON.stringify({ error: "Error al actualizar el sprint" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async DELETE(req) {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (!id || isNaN(Number(id))) {
        return new Response(JSON.stringify({ error: "ID de sprint inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const sprintId = Number(id);

      // Verificar que el sprint existe
      const sprint = await getSprintById(sprintId);
      if (!sprint || sprint.length === 0) {
        return new Response(JSON.stringify({ error: "Sprint no encontrado" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Eliminar el sprint
      const deletedSprint = await deleteSprint(sprintId);

      return new Response(JSON.stringify({ success: true, sprint: deletedSprint[0] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al eliminar sprint:", error);
      return new Response(JSON.stringify({ error: "Error al eliminar el sprint" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async GET(req) {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      const projectId = url.searchParams.get("projectId");

      // Si se proporciona un ID, obtener un sprint específico
      if (id) {
        const sprintId = Number(id);
        if (isNaN(sprintId)) {
          return new Response(JSON.stringify({ error: "ID de sprint inválido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const sprint = await getSprintById(sprintId);
        if (!sprint || sprint.length === 0) {
          return new Response(JSON.stringify({ error: "Sprint no encontrado" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, sprint: sprint[0] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Si se proporciona un projectId, obtener sprints de ese proyecto
      if (projectId) {
        const projectIdNum = Number(projectId);
        if (isNaN(projectIdNum)) {
          return new Response(JSON.stringify({ error: "ID de proyecto inválido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const sprints = await getSprintsByProjectId(projectIdNum);
        return new Response(JSON.stringify({ success: true, sprints }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Si no se proporciona ningún filtro, obtener todos los sprints
      const sprints = await getAllSprints();
      return new Response(JSON.stringify({ success: true, sprints }), {
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
