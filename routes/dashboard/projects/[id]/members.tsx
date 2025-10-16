import { DashboardLayout } from "../../../../components/DashboardLayout.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import { State } from "../../_middleware.ts";
import { getProjectById, getProjectMembers } from "../../../../utils/db.ts";
import ProjectMembersIsland from "../../../../islands/ProjectMembersIsland.tsx";

interface Member {
	id: number;
	userId: number;
	teamId: number;
	role: string;
	user: {
		id: number;
		name: string;
		email: string;
		role: string;
	};
}

interface Project {
	id: number;
	name: string;
	description: string | null;
	ownerId: number;
	createdAt: Date | null;
	updatedAt: Date | null;
	members: Member[];
}

interface ProjectMembersData {
	user: {
		id: number;
		name: string;
		email: string;
		role: string;
		formattedRole: string;
	};
	project: Project;
}

export const handler: Handlers<ProjectMembersData, State> = {
	async GET(_req, ctx) {
		try {
			const projectId = Number.parseInt(ctx.params.id);

			if (Number.isNaN(projectId)) {
				return ctx.renderNotFound();
			}

			// Obtener el proyecto
			const projectResult = await getProjectById(projectId);
			if (!projectResult || projectResult.length === 0) {
				return ctx.renderNotFound();
			}

			const project = projectResult[0];

			// Obtener los miembros del proyecto
			const members = await getProjectMembers(projectId);

			// Combinar el proyecto con sus miembros
			const projectWithMembers = {
				...project,
				members,
			};

			return ctx.render({
				user: ctx.state.user,
				project: projectWithMembers,
			});
		} catch (error) {
			console.error("Error al obtener proyecto:", error);
			return new Response("Error al obtener proyecto", { status: 500 });
		}
	},
};

export default function ProjectMembers({
	data,
}: PageProps<ProjectMembersData>) {
	const { user, project } = data;

	return (
		<DashboardLayout user={user}>
			<div class="p-6">
				<ProjectMembersIsland project={project} currentUser={user} />
			</div>
		</DashboardLayout>
	);
}
