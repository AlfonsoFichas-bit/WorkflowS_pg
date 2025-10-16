import { useState } from "preact/hooks";
import ModalIsland from "./ModalIsland.tsx";
import CreateUserFormIsland from "./CreateUserFormIsland.tsx";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";

interface TeamMembership {
	id: number;
	userId: number;
	teamId: number;
	role: string;
	team: {
		id: number;
		name: string;
		projectId: number;
	} | null;
	project: {
		id: number;
		name: string;
		description: string | null;
	} | null;
}

interface User {
	id: number;
	name: string;
	email: string;
	role: string;
	createdAt: Date | null;
	updatedAt: Date | null;
	paternalLastName: string | null;
	maternalLastName: string | null;
	password: string;
	teamMemberships?: TeamMembership[];
}

interface UsersPageIslandProps {
	user?: {
		id: number;
		name: string;
		email: string;
		role: string;
		formattedRole?: string;
	};
	usersList: User[];
}

export default function UsersPageIsland({
	user: _user,
	usersList,
}: UsersPageIslandProps) {
	const [showModal, setShowModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [userToDelete, setUserToDelete] = useState<User | null>(null);

	const handleCreateUser = async (userData: {
		name: string;
		paternalLastName: string;
		maternalLastName: string;
		email: string;
		password: string;
		role: string;
	}) => {
		setIsSubmitting(true);
		setError("");

		try {
			const response = await fetch("/dashboard/users", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: userData.name,
					paternalLastName: userData.paternalLastName,
					maternalLastName: userData.maternalLastName,
					email: userData.email,
					password: userData.password,
					role: userData.role,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Error al crear el usuario");
			}

			setSuccess("Usuario creado correctamente");
			setShowModal(false);

			// Recargar la página para mostrar el nuevo usuario
			setTimeout(() => {
				globalThis.location.reload();
			}, 1000);
		} catch (error: unknown) {
			console.error("Error:", error);
			setError(error instanceof Error ? error.message : "Error desconocido");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteUser = async () => {
		if (!userToDelete) return;

		setIsSubmitting(true);
		setError("");

		try {
			const response = await fetch(`/dashboard/users/${userToDelete.id}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Error al eliminar el usuario");
			}

			setSuccess("Usuario eliminado correctamente");
			setShowDeleteModal(false);
			setUserToDelete(null);

			// Recargar la página para actualizar la lista de usuarios
			// Usamos un enfoque más seguro para recargar la página
			setTimeout(() => {
				if (typeof globalThis !== "undefined") {
					globalThis.location.href = "/dashboard/users";
				}
			}, 1000);
		} catch (error: unknown) {
			console.error("Error:", error);
			setError(error instanceof Error ? error.message : "Error desconocido");
		} finally {
			setIsSubmitting(false);
		}
	};

	const confirmDelete = (user: User) => {
		setUserToDelete(user);
		setShowDeleteModal(true);
	};

	const formatRole = (role: string): string => {
		const roleMap: Record<string, string> = {
			admin: "Administrador",
			scrum_master: "Scrum Master",
			product_owner: "Product Owner",
			team_developer: "Team Developer",
		};

		return roleMap[role] || role;
	};

	const formatDate = (date: Date | null): string => {
		if (!date) return "N/A";
		return new Date(date).toLocaleDateString("es-ES", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	return (
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<h1 class="text-2xl font-bold">Usuarios</h1>
				<button
					type="button"
					class="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
					onClick={() => setShowModal(true)}
				>
					<MaterialSymbol icon="person_add" />
					Nuevo Usuario
				</button>
			</div>

			{success && (
				<div
					class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
					role="alert"
				>
					<span class="block sm:inline">{success}</span>
				</div>
			)}

			{error && (
				<div
					class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
					role="alert"
				>
					<span class="block sm:inline">{error}</span>
				</div>
			)}

			<div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
				{usersList && usersList.length > 0 ? (
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
							<thead class="bg-gray-50 dark:bg-gray-700">
								<tr>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
									>
										Nombre
									</th>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
									>
										Correo electrónico
									</th>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
									>
										Rol Global
									</th>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
									>
										Roles en Proyectos
									</th>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
									>
										Fecha de creación
									</th>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
									>
										Acciones
									</th>
								</tr>
							</thead>
							<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
								{usersList.map((user) => (
									<tr key={user.id}>
										<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
											{user.name}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
											{user.email}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
											<span
												class={`px-2 py-1 rounded text-xs ${
													user.role === "admin"
														? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
														: user.role === "team_leader"
															? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
															: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
												}`}
											>
												{formatRole(user.role)}
											</span>
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
											{user.teamMemberships &&
											user.teamMemberships.length > 0 ? (
												<div class="space-y-1">
													{user.teamMemberships.map((membership) => (
														<div key={membership.id} class="flex items-center">
															<span
																class={`px-2 py-1 rounded text-xs ${
																	membership.role === "product_owner"
																		? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
																		: membership.role === "scrum_master"
																			? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
																			: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
																}`}
															>
																{formatRole(membership.role)}
															</span>
															<span class="ml-2">
																{membership.project
																	? `en ${membership.project.name}`
																	: ""}
															</span>
														</div>
													))}
												</div>
											) : (
												<span class="text-gray-400">
													Sin roles en proyectos
												</span>
											)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
											{formatDate(user.createdAt)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
											<button
												type="button"
												class="text-blue-600 dark:text-blue-400 mr-3"
											>
												<MaterialSymbol icon="edit" />
											</button>
											<button
												type="button"
												class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
												onClick={() => confirmDelete(user)}
											>
												<MaterialSymbol icon="delete" />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div class="p-6">
						<p class="text-gray-500 dark:text-gray-400 text-center py-8">
							No hay usuarios disponibles
						</p>
					</div>
				)}
			</div>

			{/* Modal para crear usuario */}
			<ModalIsland
				show={showModal}
				onClose={() => setShowModal(false)}
				maxWidth="md"
			>
				<div class="p-6">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-xl font-bold">Crear Nuevo Usuario</h2>
						<button
							type="button"
							class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
							onClick={() => setShowModal(false)}
						>
							<MaterialSymbol icon="close" />
						</button>
					</div>

					{error && (
						<div
							class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
							role="alert"
						>
							<span class="block sm:inline">{error}</span>
						</div>
					)}

					<CreateUserFormIsland
						onSubmit={handleCreateUser}
						onCancel={() => setShowModal(false)}
						isSubmitting={isSubmitting}
					/>
				</div>
			</ModalIsland>

			{/* Modal para confirmar eliminación */}
			<ModalIsland
				show={showDeleteModal}
				onClose={() => {
					setShowDeleteModal(false);
					setUserToDelete(null);
				}}
				maxWidth="sm"
			>
				<div class="p-6">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-xl font-bold">Confirmar Eliminación</h2>
						<button
							type="button"
							class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
							onClick={() => {
								setShowDeleteModal(false);
								setUserToDelete(null);
							}}
						>
							<MaterialSymbol icon="close" />
						</button>
					</div>

					{error && (
						<div
							class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
							role="alert"
						>
							<span class="block sm:inline">{error}</span>
						</div>
					)}

					<div class="mb-6">
						<p class="text-gray-700 dark:text-gray-300">
							¿Estás seguro de que deseas eliminar al usuario{" "}
							<strong>{userToDelete?.name}</strong>?
						</p>
						<p class="text-gray-500 dark:text-gray-400 mt-2">
							Esta acción no se puede deshacer.
						</p>
					</div>

					<div class="flex justify-end space-x-3">
						<button
							type="button"
							class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
							onClick={() => {
								setShowDeleteModal(false);
								setUserToDelete(null);
							}}
							disabled={isSubmitting}
						>
							Cancelar
						</button>
						<button
							type="button"
							class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
							onClick={handleDeleteUser}
							disabled={isSubmitting}
						>
							{isSubmitting ? "Eliminando..." : "Eliminar"}
						</button>
					</div>
				</div>
			</ModalIsland>
		</div>
	);
}
