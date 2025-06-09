import { Handlers } from "$fresh/server.ts";
import { createTask, deleteTask, getTaskById, updateTask, getSprintById, getUserById, getAllTasks, getTasksBySprintId, getTasksByAssigneeId } from "../../utils/db.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { title, description, sprintId, assigneeId, status, priority, storyPoints } = body;

      // Validar datos
      if (!title) {
        return new Response(JSON.stringify({ error: "El título de la tarea es obligatorio" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verificar que el sprint existe si se proporciona
      if (sprintId) {
        const sprint = await getSprintById(sprintId);
        if (!sprint || sprint.length === 0) {
          return new Response(JSON.stringify({ error: "El sprint no existe" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Verificar que el usuario asignado existe si se proporciona
      if (assigneeId) {
        const user = await getUserById(assigneeId);
        if (!user || user.length === 0) {
          return new Response(JSON.stringify({ error: "El usuario asignado no existe" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Crear la tarea
      const newTask = await createTask({
        title,
        description,
        sprintId,
        assigneeId,
        status: status || "todo",
        priority: priority || "medium",
        storyPoints: storyPoints !== undefined && storyPoints !== null ? storyPoints : null,
      });

      return new Response(JSON.stringify({ success: true, task: newTask[0] }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al crear tarea:", error);
      return new Response(JSON.stringify({ error: "Error al crear la tarea" }), {
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
        return new Response(JSON.stringify({ error: "ID de tarea inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const taskId = Number(id);

      // Verificar que la tarea existe
      const task = await getTaskById(taskId);
      if (!task || task.length === 0) {
        return new Response(JSON.stringify({ error: "Tarea no encontrada" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { title, description, sprintId, assigneeId, status, priority, storyPoints } = body;

      // Preparar datos para actualización
      const updateData: Record<string, unknown> = {};

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (sprintId !== undefined) updateData.sprintId = sprintId;
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (storyPoints !== undefined) updateData.storyPoints = storyPoints;

      // Verificar que el sprint existe si se va a actualizar
      if (sprintId !== undefined && sprintId !== null) {
        const sprint = await getSprintById(sprintId);
        if (!sprint || sprint.length === 0) {
          return new Response(JSON.stringify({ error: "El sprint no existe" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Verificar que el usuario asignado existe si se va a actualizar
      if (assigneeId !== undefined && assigneeId !== null) {
        const user = await getUserById(assigneeId);
        if (!user || user.length === 0) {
          return new Response(JSON.stringify({ error: "El usuario asignado no existe" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Actualizar la tarea
      const updatedTask = await updateTask(taskId, updateData);

      return new Response(JSON.stringify({ success: true, task: updatedTask[0] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al actualizar tarea:", error);
      return new Response(JSON.stringify({ error: "Error al actualizar la tarea" }), {
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
        return new Response(JSON.stringify({ error: "ID de tarea inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const taskId = Number(id);

      // Verificar que la tarea existe
      const task = await getTaskById(taskId);
      if (!task || task.length === 0) {
        return new Response(JSON.stringify({ error: "Tarea no encontrada" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Eliminar la tarea
      const deletedTask = await deleteTask(taskId);

      return new Response(JSON.stringify({ success: true, task: deletedTask[0] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      return new Response(JSON.stringify({ error: "Error al eliminar la tarea" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async GET(req) {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      const sprintId = url.searchParams.get("sprintId");
      const assigneeId = url.searchParams.get("assigneeId");

      // Si se proporciona un ID, obtener una tarea específica
      if (id) {
        const taskId = Number(id);
        if (isNaN(taskId)) {
          return new Response(JSON.stringify({ error: "ID de tarea inválido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const task = await getTaskById(taskId);
        if (!task || task.length === 0) {
          return new Response(JSON.stringify({ error: "Tarea no encontrada" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, task: task[0] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Si se proporciona un sprintId, obtener tareas de ese sprint
      if (sprintId) {
        const sprintIdNum = Number(sprintId);
        if (isNaN(sprintIdNum)) {
          return new Response(JSON.stringify({ error: "ID de sprint inválido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const tasks = await getTasksBySprintId(sprintIdNum);
        return new Response(JSON.stringify({ success: true, tasks }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Si se proporciona un assigneeId, obtener tareas asignadas a ese usuario
      if (assigneeId) {
        const assigneeIdNum = Number(assigneeId);
        if (isNaN(assigneeIdNum)) {
          return new Response(JSON.stringify({ error: "ID de usuario inválido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const tasks = await getTasksByAssigneeId(assigneeIdNum);
        return new Response(JSON.stringify({ success: true, tasks }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Si no se proporciona ningún filtro, obtener todas las tareas
      const tasks = await getAllTasks();
      return new Response(JSON.stringify({ success: true, tasks }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al obtener tareas:", error);
      return new Response(JSON.stringify({ error: "Error al obtener tareas" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
};
