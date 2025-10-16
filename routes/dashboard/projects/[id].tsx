import { Handlers } from "$fresh/server.ts";
import { State } from "../_middleware.ts";
import {
	deleteProject,
	getProjectById,
	getProjectMembers,
	updateUser,
} from "../../../utils/db.ts";

export const handler: Handlers<unknown, State> = {
	async GET(_req, ctx) {
		try {
			const projectId = Number.parseInt(ctx.params.id);

			if (Number.isNaN(projectId)) {
				return new Response(
					JSON.stringify({ error: "ID de proyecto inválido" }),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Obtener el proyecto
			const project = await getProjectById(projectId);
			if (!project || project.length === 0) {
				return new Response(
					JSON.stringify({ error: "Proyecto no encontrado" }),
					{
						status: 404,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Obtener los miembros del proyecto
			const members = await getProjectMembers(projectId);

			// Combinar el proyecto con sus miembros
			const projectWithMembers = {
				...project[0],
				members,
			};

			return new Response(
				JSON.stringify({ success: true, project: projectWithMembers }),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		} catch (error) {
			console.error("Error al obtener proyecto:", error);

			return new Response(
				JSON.stringify({ error: "Error al obtener el proyecto" }),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	},

	async DELETE(_req, ctx) {
		try {
			const projectId = Number.parseInt(ctx.params.id);

			if (Number.isNaN(projectId)) {
				return new Response(
					JSON.stringify({ error: "ID de proyecto inválido" }),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Verificar que el proyecto existe
			const project = await getProjectById(projectId);
			if (!project || project.length === 0) {
				return new Response(
					JSON.stringify({ error: "Proyecto no encontrado" }),
					{
						status: 404,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Obtener los miembros del proyecto antes de eliminarlo
			const members = await getProjectMembers(projectId);

			// Eliminar el proyecto
			const deletedProject = await deleteProject(projectId);

			// Resetear el rol de los usuarios a "team_developer"
			for (const member of members) {
				await updateUser(member.userId, { role: "team_developer" });
			}

			return new Response(
				JSON.stringify({ success: true, project: deletedProject[0] }),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		} catch (error) {
			console.error("Error al eliminar proyecto:", error);

			return new Response(
				JSON.stringify({ error: "Error al eliminar el proyecto" }),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	},
};
