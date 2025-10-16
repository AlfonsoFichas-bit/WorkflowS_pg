import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import Modal from "../components/Modal.tsx";

interface Sprint {
	id: number;
	name: string;
	description: string | null;
	projectId: number;
	startDate: Date;
	endDate: Date;
	status: string;
	createdAt: Date | null;
	updatedAt: Date | null;
}

interface User {
	id: number;
	name: string;
	email: string;
	role: string;
	formattedRole: string;
}

interface Project {
	id: number;
	name: string;
}

interface SprintsPageIslandProps {
	user: User;
	sprints: Sprint[];
	projects: Project[];
	selectedProjectId?: number;
}

export default function SprintsPageIsland({
	user: _user,
	sprints,
	projects,
	selectedProjectId,
}: SprintsPageIslandProps) {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sprintsList, setSprintsList] = useState<Sprint[]>(sprints);
	const [currentProject, setCurrentProject] = useState<number | undefined>(
		selectedProjectId,
	);

	// Form state
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		projectId: selectedProjectId || "",
		startDate: "",
		endDate: "",
		status: "planned",
	});

	// Handle form input changes
	const handleInputChange = (e: Event) => {
		const target = e.target as
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement;
		const value = target.value;
		const name = target.name;

		setFormData({
			...formData,
			[name]: value,
		});
	};

	// Handle project selection change
	const handleProjectChange = (e: Event) => {
		const target = e.target as HTMLSelectElement;
		const projectId = target.value ? parseInt(target.value) : undefined;
		setCurrentProject(projectId);

		// Redirect to the sprints page with the selected project
		if (projectId) {
			globalThis.location.href = `/dashboard/sprints?projectId=${projectId}`;
		} else {
			globalThis.location.href = "/dashboard/sprints";
		}
	};

	// Handle form submission
	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			// Validate form data
			if (!formData.name) {
				throw new Error("El nombre del sprint es obligatorio");
			}
			if (!formData.projectId) {
				throw new Error("Debe seleccionar un proyecto");
			}
			if (!formData.startDate) {
				throw new Error("La fecha de inicio es obligatoria");
			}
			if (!formData.endDate) {
				throw new Error("La fecha de fin es obligatoria");
			}

			// Validate dates
			const startDate = new Date(formData.startDate);
			const endDate = new Date(formData.endDate);
			if (endDate <= startDate) {
				throw new Error(
					"La fecha de fin debe ser posterior a la fecha de inicio",
				);
			}

			// Create sprint
			const response = await fetch("/api/sprints", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: formData.name,
					description: formData.description,
					projectId: parseInt(formData.projectId.toString()),
					startDate: formData.startDate,
					endDate: formData.endDate,
					status: formData.status,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Error al crear el sprint");
			}

			const data = await response.json();

			// Add the new sprint to the list
			setSprintsList([...sprintsList, data.sprint]);

			// Reset form and close modal
			setFormData({
				name: "",
				description: "",
				projectId: selectedProjectId || "",
				startDate: "",
				endDate: "",
				status: "planned",
			});
			setShowCreateModal(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
		} finally {
			setIsLoading(false);
		}
	};

	// Format date for display
	const formatDate = (dateString: Date) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("es-ES", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	// Get status badge class
	const getStatusBadgeClass = (status: string) => {
		switch (status) {
			case "planned":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
			case "active":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
			case "completed":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
			case "cancelled":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
		}
	};

	// Get status label
	const getStatusLabel = (status: string) => {
		switch (status) {
			case "planned":
				return "Planificado";
			case "active":
				return "Activo";
			case "completed":
				return "Completado";
			case "cancelled":
				return "Cancelado";
			default:
				return status;
		}
	};

	return (
		<div class="space-y-6">
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold">Sprints</h1>
					<p class="text-gray-500 dark:text-gray-400">
						Gestiona los sprints de tus proyectos
					</p>
				</div>

				<div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
					<div class="w-full sm:w-64">
						<select
							class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
							value={currentProject}
							onChange={handleProjectChange}
						>
							<option value="">Todos los proyectos</option>
							{projects.map((project) => (
								<option key={project.id} value={project.id}>
									{project.name}
								</option>
							))}
						</select>
					</div>

					<Button
						onClick={() => setShowCreateModal(true)}
						class="flex items-center justify-center gap-2"
					>
						<MaterialSymbol icon="add" />
						Nuevo Sprint
					</Button>
				</div>
			</div>

			{/* Sprints list */}
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
				{sprintsList.length > 0 ? (
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
										Proyecto
									</th>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
									>
										Fechas
									</th>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
									>
										Estado
									</th>
									<th
										scope="col"
										class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
									>
										Acciones
									</th>
								</tr>
							</thead>
							<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
								{sprintsList.map((sprint) => {
									const project = projects.find(
										(p) => p.id === sprint.projectId,
									);
									return (
										<tr
											key={sprint.id}
											class="hover:bg-gray-50 dark:hover:bg-gray-700"
										>
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="text-sm font-medium text-gray-900 dark:text-white">
													{sprint.name}
												</div>
												{sprint.description && (
													<div class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
														{sprint.description}
													</div>
												)}
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="text-sm text-gray-900 dark:text-white">
													{project?.name || `Proyecto ${sprint.projectId}`}
												</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="text-sm text-gray-900 dark:text-white">
													{formatDate(sprint.startDate)}
												</div>
												<div class="text-sm text-gray-500 dark:text-gray-400">
													hasta {formatDate(sprint.endDate)}
												</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<span
													class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(sprint.status)}`}
												>
													{getStatusLabel(sprint.status)}
												</span>
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<a
													href={`/dashboard/sprints/${sprint.id}`}
													class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
												>
													Ver
												</a>
												<button
													type="button"
													class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
												>
													Eliminar
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				) : (
					<div class="p-6 text-center">
						<p class="text-gray-500 dark:text-gray-400">
							{currentProject
								? "No hay sprints para este proyecto. Crea uno nuevo para comenzar."
								: "No hay sprints disponibles. Selecciona un proyecto o crea un nuevo sprint."}
						</p>
					</div>
				)}
			</div>

			{/* Create Sprint Modal */}
			<Modal show={showCreateModal} onClose={() => setShowCreateModal(false)}>
				<form onSubmit={handleSubmit} class="space-y-4">
					{error && (
						<div
							class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:border-red-700 dark:text-red-300"
							role="alert"
						>
							<span class="block sm:inline">{error}</span>
						</div>
					)}

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Proyecto *
						</label>
						<select
							name="projectId"
							value={formData.projectId}
							onChange={handleInputChange}
							class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
							required
						>
							<option value="">Selecciona un proyecto</option>
							{projects.map((project) => (
								<option key={project.id} value={project.id}>
									{project.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Nombre del Sprint *
						</label>
						<input
							type="text"
							name="name"
							value={formData.name}
							onChange={handleInputChange}
							class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
							required
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Descripción
						</label>
						<textarea
							name="description"
							value={formData.description}
							onChange={handleInputChange}
							rows={3}
							class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
						></textarea>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Fecha de inicio *
							</label>
							<input
								type="date"
								name="startDate"
								value={formData.startDate}
								onChange={handleInputChange}
								class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
								required
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Fecha de fin *
							</label>
							<input
								type="date"
								name="endDate"
								value={formData.endDate}
								onChange={handleInputChange}
								class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
								required
							/>
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Estado
						</label>
						<select
							name="status"
							value={formData.status}
							onChange={handleInputChange}
							class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
						>
							<option value="planned">Planificado</option>
							<option value="active">Activo</option>
							<option value="completed">Completado</option>
							<option value="cancelled">Cancelado</option>
						</select>
					</div>

					<div class="flex justify-end space-x-3 pt-4">
						<Button
							type="button"
							onClick={() => setShowCreateModal(false)}
							class="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={isLoading}
							class={isLoading ? "opacity-70 cursor-not-allowed" : ""}
						>
							{isLoading ? "Creando..." : "Crear Sprint"}
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
