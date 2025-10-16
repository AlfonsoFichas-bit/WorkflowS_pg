import { DashboardLayout } from "../../components/DashboardLayout.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import { State } from "./_middleware.ts";
import { getRubricsByCreatorId } from "../../utils/db.ts";
import RubricsPageIsland from "../../islands/RubricsPageIsland.tsx";

interface Rubric {
	id: number;
	name: string;
	description: string | null;
	creatorId: number;
	maxScore: number;
	createdAt: Date | null;
	updatedAt: Date | null;
}

interface RubricsData {
	user: {
		id: number;
		name: string;
		email: string;
		role: string;
		formattedRole: string;
	};
	rubrics: Rubric[];
	isTeacher: boolean;
}

export const handler: Handlers<RubricsData, State> = {
	async GET(_req, ctx) {
		// El middleware ya ha verificado la autenticación y ha añadido el usuario al estado
		const user = ctx.state.user;

		// Verificar si el usuario es profesor
		const isTeacher = user.role === "teacher" || user.role === "admin";

		// Si no es profesor, redirigir al dashboard
		if (!isTeacher) {
			return new Response("", {
				status: 302,
				headers: { Location: "/dashboard" },
			});
		}

		// Obtener las rúbricas creadas por el profesor
		const rubrics = await getRubricsByCreatorId(user.id);

		return ctx.render({
			user,
			rubrics,
			isTeacher,
		});
	},
};

export default function Rubrics({ data }: PageProps<RubricsData>) {
	const { user, rubrics, isTeacher } = data;

	return (
		<DashboardLayout user={user}>
			<div class="p-6">
				<RubricsPageIsland
					user={user}
					rubrics={rubrics}
					isTeacher={isTeacher}
				/>
			</div>
		</DashboardLayout>
	);
}
