import { Handlers } from "$fresh/server.ts";
import { createUserStory, deleteUserStory, getUserStoryById, updateUserStory, getProjectById, getSprintById, getAllUserStories, getUserStoriesByProjectId, getUserStoriesBySprintId } from "../../utils/db.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { title, description, acceptanceCriteria, projectId, sprintId, status, priority, storyPoints } = body;

      // Validar datos
      if (!title) {
        return new Response(JSON.stringify({ error: "El título de la historia de usuario es obligatorio" }), {
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

      // Verificar que el proyecto existe
      const project = await getProjectById(projectId);
      if (!project || project.length === 0) {
        return new Response(JSON.stringify({ error: "El proyecto no existe" }), {
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

        // Verificar que el sprint pertenece al proyecto
        if (sprint[0].projectId !== projectId) {
          return new Response(JSON.stringify({ error: "El sprint no pertenece al proyecto seleccionado" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Crear la historia de usuario
      const newUserStory = await createUserStory({
        title,
        description,
        acceptanceCriteria,
        projectId,
        sprintId,
        status: status || "pending",
        priority: priority || "medium",
        storyPoints: storyPoints !== undefined && storyPoints !== null ? storyPoints : null,
      });

      return new Response(JSON.stringify({ success: true, userStory: newUserStory[0] }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al crear historia de usuario:", error);
      return new Response(JSON.stringify({ error: "Error al crear la historia de usuario" }), {
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
        return new Response(JSON.stringify({ error: "ID de historia de usuario inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const userStoryId = Number(id);

      // Verificar que la historia de usuario existe
      const userStory = await getUserStoryById(userStoryId);
      if (!userStory || userStory.length === 0) {
        return new Response(JSON.stringify({ error: "Historia de usuario no encontrada" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { title, description, acceptanceCriteria, projectId, sprintId, status, priority, storyPoints } = body;

      // Preparar datos para actualización
      const updateData: Record<string, unknown> = {};

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (acceptanceCriteria !== undefined) updateData.acceptanceCriteria = acceptanceCriteria;
      if (projectId !== undefined) updateData.projectId = projectId;
      if (sprintId !== undefined) updateData.sprintId = sprintId;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (storyPoints !== undefined) updateData.storyPoints = storyPoints;

      // Verificar que el proyecto existe si se va a actualizar
      if (projectId !== undefined) {
        const project = await getProjectById(projectId);
        if (!project || project.length === 0) {
          return new Response(JSON.stringify({ error: "El proyecto no existe" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Verificar que el sprint existe si se va a actualizar
      if (sprintId !== undefined && sprintId !== null) {
        const sprint = await getSprintById(sprintId);
        if (!sprint || sprint.length === 0) {
          return new Response(JSON.stringify({ error: "El sprint no existe" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Verificar que el sprint pertenece al proyecto
        const projectIdToCheck = projectId !== undefined ? projectId : userStory[0].projectId;
        if (sprint[0].projectId !== projectIdToCheck) {
          return new Response(JSON.stringify({ error: "El sprint no pertenece al proyecto seleccionado" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Actualizar la historia de usuario
      const updatedUserStory = await updateUserStory(userStoryId, updateData);

      return new Response(JSON.stringify({ success: true, userStory: updatedUserStory[0] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al actualizar historia de usuario:", error);
      return new Response(JSON.stringify({ error: "Error al actualizar la historia de usuario" }), {
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
        return new Response(JSON.stringify({ error: "ID de historia de usuario inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const userStoryId = Number(id);

      // Verificar que la historia de usuario existe
      const userStory = await getUserStoryById(userStoryId);
      if (!userStory || userStory.length === 0) {
        return new Response(JSON.stringify({ error: "Historia de usuario no encontrada" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Eliminar la historia de usuario
      const deletedUserStory = await deleteUserStory(userStoryId);

      return new Response(JSON.stringify({ success: true, userStory: deletedUserStory[0] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al eliminar historia de usuario:", error);
      return new Response(JSON.stringify({ error: "Error al eliminar la historia de usuario" }), {
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
      const sprintId = url.searchParams.get("sprintId");

      // Si se proporciona un ID, obtener una historia de usuario específica
      if (id) {
        const userStoryId = Number(id);
        if (isNaN(userStoryId)) {
          return new Response(JSON.stringify({ error: "ID de historia de usuario inválido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const userStory = await getUserStoryById(userStoryId);
        if (!userStory || userStory.length === 0) {
          return new Response(JSON.stringify({ error: "Historia de usuario no encontrada" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, userStory: userStory[0] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Si se proporciona un projectId, obtener historias de usuario de ese proyecto
      if (projectId) {
        const projectIdNum = Number(projectId);
        if (isNaN(projectIdNum)) {
          return new Response(JSON.stringify({ error: "ID de proyecto inválido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const userStories = await getUserStoriesByProjectId(projectIdNum);
        return new Response(JSON.stringify({ success: true, userStories }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Si se proporciona un sprintId, obtener historias de usuario de ese sprint
      if (sprintId) {
        const sprintIdNum = Number(sprintId);
        if (isNaN(sprintIdNum)) {
          return new Response(JSON.stringify({ error: "ID de sprint inválido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const userStories = await getUserStoriesBySprintId(sprintIdNum);
        return new Response(JSON.stringify({ success: true, userStories }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Si no se proporciona ningún filtro, obtener todas las historias de usuario
      const userStories = await getAllUserStories();
      return new Response(JSON.stringify({ success: true, userStories }), {
        status: 200,
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
