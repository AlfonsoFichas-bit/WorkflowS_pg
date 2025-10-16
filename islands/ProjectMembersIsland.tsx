import { MaterialSymbol } from "../components/MaterialSymbol.tsx";

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

interface ProjectMembersIslandProps {
	project: Project;
	currentUser: {
		id: number;
		name: string;
		email: string;
		role: string;
	};
}

export default function ProjectMembersIsland({
	project,
	currentUser: _currentUser,
}: ProjectMembersIslandProps) {
	const formatRole = (role: string): string => {
		const roleMap: Record<string, string> = {
			admin: "Administrador",
			scrum_master: "Scrum Master",
			product_owner: "Product Owner",
			team_developer: "Team Developer",
			team_member: "Miembro del Equipo",
		};

		return roleMap[role] || role;
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">
					Miembros del Proyecto: {project.name}
				</h1>
				<a
					href="/dashboard/projects"
					className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-md flex items-center"
				>
					<MaterialSymbol icon="arrow_back" className="mr-1" />
					Volver a Proyectos
				</a>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
				{project.members && project.members.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
							<thead className="bg-gray-50 dark:bg-gray-700">
								<tr>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
									>
										Nombre
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
									>
										Correo electrónico
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
									>
										Rol en el Proyecto
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
									>
										Rol Global
									</th>
								</tr>
							</thead>
							<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
								{project.members.map((member) => (
									<tr key={member.id}>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											{member.user.name}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
											{member.user.email}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
											<span
												className={`px-2 py-1 rounded text-xs ${
													member.role === "product_owner"
														? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
														: member.role === "scrum_master"
															? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
															: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
												}`}
											>
												{formatRole(member.role)}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
											<span
												className={`px-2 py-1 rounded text-xs ${
													member.user.role === "admin"
														? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
														: member.user.role === "product_owner"
															? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
															: member.user.role === "scrum_master"
																? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
																: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
												}`}
											>
												{formatRole(member.user.role)}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="p-6">
						<p className="text-gray-500 dark:text-gray-400 text-center py-8">
							Este proyecto no tiene miembros asignados
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
