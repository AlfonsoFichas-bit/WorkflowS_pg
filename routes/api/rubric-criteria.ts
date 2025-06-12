import { Handlers } from "$fresh/server.ts";
import { ApiState } from "./_middleware.ts"; // Import ApiState
import { 
  createRubricCriterion, 
  deleteRubricCriterion, 
  getRubricCriterionById, 
  updateRubricCriterion, 
  getRubricCriteriaByRubricId,
  getRubricById
} from "../../src/db/db.ts"; // Corrected import path

// Define specific data types for request/response if needed, or use unknown/any
// For example: type RubricCriterionData = { rubricId: number, name: string, ... };
export const handler: Handlers<unknown, ApiState> = { // Use ApiState
  async POST(req, ctx) {
    try {
      const body = await req.json();
      const { rubricId, name, description, weight, maxScore } = body;

      // Validar datos
      if (!rubricId) {
        return new Response(JSON.stringify({ error: "El ID de la rúbrica es obligatorio" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!name) {
        return new Response(JSON.stringify({ error: "El nombre del criterio es obligatorio" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verificar que la rúbrica existe
      const rubric = await getRubricById(rubricId);
      if (!rubric || rubric.length === 0) {
        return new Response(JSON.stringify({ error: "La rúbrica no existe" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Obtener el ID del usuario del contexto
      // ctx.state.user is now typed and guaranteed by middleware
      const currentUserId = ctx.state.user.id;
      const currentUserRole = ctx.state.user.role;

      // Verificar que el usuario es el creador de la rúbrica o un administrador
      if (rubric[0].creatorId !== currentUserId && currentUserRole !== "admin") {
        return new Response(JSON.stringify({ error: "No tienes permisos para añadir criterios a esta rúbrica" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Crear el criterio
      const newCriterion = await createRubricCriterion({
        rubricId,
        name,
        description,
        weight: weight || 1,
        maxScore: maxScore || 10,
      });

      return new Response(JSON.stringify({ success: true, criterion: newCriterion[0] }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al crear criterio:", error);
      return new Response(JSON.stringify({ error: "Error al crear el criterio" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async PUT(req, ctx) {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (!id || isNaN(Number(id))) {
        return new Response(JSON.stringify({ error: "ID de criterio inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const criterionId = Number(id);

      // Verificar que el criterio existe
      const criterion = await getRubricCriterionById(criterionId);
      if (!criterion || criterion.length === 0) {
        return new Response(JSON.stringify({ error: "Criterio no encontrado" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Obtener la rúbrica asociada
      const rubric = await getRubricById(criterion[0].rubricId);
      if (!rubric || rubric.length === 0) {
        return new Response(JSON.stringify({ error: "Rúbrica no encontrada" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Obtener el ID del usuario del contexto
      const currentUserId = ctx.state.user.id;
      const currentUserRole = ctx.state.user.role;

      // Verificar que el usuario es el creador de la rúbrica o un administrador
      if (rubric[0].creatorId !== currentUserId && currentUserRole !== "admin") {
        return new Response(JSON.stringify({ error: "No tienes permisos para modificar este criterio" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { name, description, weight, maxScore } = body;

      // Preparar datos para actualización
      const updateData: Record<string, unknown> = {};

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (weight !== undefined) updateData.weight = weight;
      if (maxScore !== undefined) updateData.maxScore = maxScore;

      // Actualizar el criterio
      const updatedCriterion = await updateRubricCriterion(criterionId, updateData);

      return new Response(JSON.stringify({ success: true, criterion: updatedCriterion[0] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al actualizar criterio:", error);
      return new Response(JSON.stringify({ error: "Error al actualizar el criterio" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async DELETE(req, ctx) {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (!id || isNaN(Number(id))) {
        return new Response(JSON.stringify({ error: "ID de criterio inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const criterionId = Number(id);

      // Verificar que el criterio existe
      const criterion = await getRubricCriterionById(criterionId);
      if (!criterion || criterion.length === 0) {
        return new Response(JSON.stringify({ error: "Criterio no encontrado" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Obtener la rúbrica asociada
      const rubric = await getRubricById(criterion[0].rubricId);
      if (!rubric || rubric.length === 0) {
        return new Response(JSON.stringify({ error: "Rúbrica no encontrada" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Obtener el ID del usuario del contexto
      const currentUserId = ctx.state.user.id;
      const currentUserRole = ctx.state.user.role;

      // Verificar que el usuario es el creador de la rúbrica o un administrador
      if (rubric[0].creatorId !== currentUserId && currentUserRole !== "admin") {
        return new Response(JSON.stringify({ error: "No tienes permisos para eliminar este criterio" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Eliminar el criterio
      const deletedCriterion = await deleteRubricCriterion(criterionId);

      return new Response(JSON.stringify({ success: true, criterion: deletedCriterion[0] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al eliminar criterio:", error);
      return new Response(JSON.stringify({ error: "Error al eliminar el criterio" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async GET(req, _ctx) { // ctx might not be needed if not accessing state
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      const rubricId = url.searchParams.get("rubricId");

      // Si se proporciona un ID, obtener un criterio específico
      if (id) {
        const criterionId = Number(id);
        if (isNaN(criterionId)) {
          return new Response(JSON.stringify({ error: "ID de criterio inválido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const criterion = await getRubricCriterionById(criterionId);
        if (!criterion || criterion.length === 0) {
          return new Response(JSON.stringify({ error: "Criterio no encontrado" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, criterion: criterion[0] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Si se proporciona un rubricId, obtener criterios de esa rúbrica
      if (rubricId) {
        const rubricIdNum = Number(rubricId);
        if (isNaN(rubricIdNum)) {
          return new Response(JSON.stringify({ error: "ID de rúbrica inválido" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Verificar que la rúbrica existe
        const rubric = await getRubricById(rubricIdNum);
        if (!rubric || rubric.length === 0) {
          return new Response(JSON.stringify({ error: "Rúbrica no encontrada" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        const criteria = await getRubricCriteriaByRubricId(rubricIdNum);
        return new Response(JSON.stringify({ success: true, criteria }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Si no se proporciona ningún filtro, devolver error
      return new Response(JSON.stringify({ error: "Se requiere un ID de criterio o un ID de rúbrica" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al obtener criterios:", error);
      return new Response(JSON.stringify({ error: "Error al obtener criterios" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};