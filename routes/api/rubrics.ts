import { Handlers } from "$fresh/server.ts";
import { getSessionData } from "../../utils/auth.ts";
import {
	createRubric,
	deleteRubric,
	getRubricById,
	updateRubric,
	getAllRubrics,
	getRubricsByCreatorId,
} from "../../utils/db.ts";

export const handler: Handlers = {
	async POST(req, _ctx) {
		try {
			const body = await req.json();
			const { name, description, maxScore } = body;

			// Validar datos
			if (!name) {
				return new Response(
					JSON.stringify({ error: "El nombre de la rúbrica es obligatorio" }),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Obtener el ID del usuario del contexto
			const user = getSessionData(req);
			if (!user || !user.id) {
				return new Response(
					JSON.stringify({ error: "Usuario no autenticado" }),
					{
						status: 401,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Verificar que el usuario es profesor o administrador
			if (user.role !== "teacher" && user.role !== "admin") {
				return new Response(
					JSON.stringify({ error: "No tienes permisos para crear rúbricas" }),
					{
						status: 403,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Crear la rúbrica
			const newRubric = await createRubric({
				name,
				description,
				creatorId: user.id,
				maxScore: maxScore || 100,
			});

			return new Response(
				JSON.stringify({ success: true, rubric: newRubric[0] }),
				{
					status: 201,
					headers: { "Content-Type": "application/json" },
				},
			);
		} catch (error) {
			console.error("Error al crear rúbrica:", error);
			return new Response(
				JSON.stringify({ error: "Error al crear la rúbrica" }),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	},

	async PUT(req, _ctx) {
		try {
			const url = new URL(req.url);
			const id = url.searchParams.get("id");

			if (!id || isNaN(Number(id))) {
				return new Response(
					JSON.stringify({ error: "ID de rúbrica inválido" }),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			const rubricId = Number(id);

			// Verificar que la rúbrica existe
			const rubric = await getRubricById(rubricId);
			if (!rubric || rubric.length === 0) {
				return new Response(
					JSON.stringify({ error: "Rúbrica no encontrada" }),
					{
						status: 404,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Obtener el ID del usuario del contexto
			const user = getSessionData(req);
			if (!user || !user.id) {
				return new Response(
					JSON.stringify({ error: "Usuario no autenticado" }),
					{
						status: 401,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Verificar que el usuario es el creador de la rúbrica o un administrador
			if (rubric[0].creatorId !== user.id && user.role !== "admin") {
				return new Response(
					JSON.stringify({
						error: "No tienes permisos para modificar esta rúbrica",
					}),
					{
						status: 403,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			const body = await req.json();
			const { name, description, maxScore } = body;

			// Preparar datos para actualización
			const updateData: Record<string, unknown> = {};

			if (name !== undefined) updateData.name = name;
			if (description !== undefined) updateData.description = description;
			if (maxScore !== undefined) updateData.maxScore = maxScore;

			// Actualizar la rúbrica
			const updatedRubric = await updateRubric(rubricId, updateData);

			return new Response(
				JSON.stringify({ success: true, rubric: updatedRubric[0] }),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		} catch (error) {
			console.error("Error al actualizar rúbrica:", error);
			return new Response(
				JSON.stringify({ error: "Error al actualizar la rúbrica" }),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	},

	async DELETE(req, _ctx) {
		try {
			const url = new URL(req.url);
			const id = url.searchParams.get("id");

			if (!id || isNaN(Number(id))) {
				return new Response(
					JSON.stringify({ error: "ID de rúbrica inválido" }),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			const rubricId = Number(id);

			// Verificar que la rúbrica existe
			const rubric = await getRubricById(rubricId);
			if (!rubric || rubric.length === 0) {
				return new Response(
					JSON.stringify({ error: "Rúbrica no encontrada" }),
					{
						status: 404,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Obtener el ID del usuario del contexto
			const user = getSessionData(req);
			if (!user || !user.id) {
				return new Response(
					JSON.stringify({ error: "Usuario no autenticado" }),
					{
						status: 401,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Verificar que el usuario es el creador de la rúbrica o un administrador
			if (rubric[0].creatorId !== user.id && user.role !== "admin") {
				return new Response(
					JSON.stringify({
						error: "No tienes permisos para eliminar esta rúbrica",
					}),
					{
						status: 403,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Eliminar la rúbrica
			const deletedRubric = await deleteRubric(rubricId);

			return new Response(
				JSON.stringify({ success: true, rubric: deletedRubric[0] }),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		} catch (error) {
			console.error("Error al eliminar rúbrica:", error);
			return new Response(
				JSON.stringify({ error: "Error al eliminar la rúbrica" }),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	},

	async GET(req, _ctx) {
		try {
			const url = new URL(req.url);
			const id = url.searchParams.get("id");
			const creatorId = url.searchParams.get("creatorId");

			// Si se proporciona un ID, obtener una rúbrica específica
			if (id) {
				const rubricId = Number(id);
				if (isNaN(rubricId)) {
					return new Response(
						JSON.stringify({ error: "ID de rúbrica inválido" }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				const rubric = await getRubricById(rubricId);
				if (!rubric || rubric.length === 0) {
					return new Response(
						JSON.stringify({ error: "Rúbrica no encontrada" }),
						{
							status: 404,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				return new Response(
					JSON.stringify({ success: true, rubric: rubric[0] }),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Si se proporciona un creatorId, obtener rúbricas de ese creador
			if (creatorId) {
				const creatorIdNum = Number(creatorId);
				if (isNaN(creatorIdNum)) {
					return new Response(
						JSON.stringify({ error: "ID de creador inválido" }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				const rubrics = await getRubricsByCreatorId(creatorIdNum);
				return new Response(JSON.stringify({ success: true, rubrics }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			// Si no se proporciona ningún filtro, obtener todas las rúbricas
			// Verificar que el usuario tiene permisos para ver todas las rúbricas
			const user = getSessionData(req);
			if (!user || (user.role !== "teacher" && user.role !== "admin")) {
				return new Response(
					JSON.stringify({
						error: "No tienes permisos para ver todas las rúbricas",
					}),
					{
						status: 403,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			const rubrics = await getAllRubrics();
			return new Response(JSON.stringify({ success: true, rubrics }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		} catch (error) {
			console.error("Error al obtener rúbricas:", error);
			return new Response(
				JSON.stringify({ error: "Error al obtener rúbricas" }),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	},
};
