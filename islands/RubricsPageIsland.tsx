import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import Modal from "../components/Modal.tsx";

interface Rubric {
	id: number;
	name: string;
	description: string | null;
	creatorId: number;
	maxScore: number;
	createdAt: Date | null;
	updatedAt: Date | null;
}

interface RubricCriterion {
	id: number;
	rubricId: number;
	name: string;
	description: string | null;
	weight: number;
	maxScore: number;
}

interface User {
	id: number;
	name: string;
	email: string;
	role: string;
	formattedRole: string;
}

interface RubricsPageIslandProps {
	user?: User;
	rubrics: Rubric[];
	isTeacher?: boolean;
}

export default function RubricsPageIsland({
	user: _user,
	rubrics,
	isTeacher: _isTeacher,
}: RubricsPageIslandProps) {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showCriteriaModal, setShowCriteriaModal] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [rubricsList, setRubricsList] = useState<Rubric[]>(rubrics);
	const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
	const [criteria, setCriteria] = useState<RubricCriterion[]>([]);

	// Form state for rubric
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		maxScore: "100",
	});

	// Form state for criterion
	const [criterionForm, setCriterionForm] = useState({
		name: "",
		description: "",
		weight: "1",
		maxScore: "10",
	});

	// Handle form input changes for rubric
	const handleInputChange = (e: Event) => {
		const target = e.target as HTMLInputElement | HTMLTextAreaElement;
		const value = target.value;
		const name = target.name;

		setFormData({
			...formData,
			[name]: value,
		});
	};

	// Handle form input changes for criterion
	const handleCriterionInputChange = (e: Event) => {
		const target = e.target as HTMLInputElement | HTMLTextAreaElement;
		const value = target.value;
		const name = target.name;

		setCriterionForm({
			...criterionForm,
			[name]: value,
		});
	};

	// Handle rubric form submission
	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			// Validate form data
			if (!formData.name) {
				throw new Error("El nombre de la rúbrica es obligatorio");
			}

			// Create rubric
			const response = await fetch("/api/rubrics", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: formData.name,
					description: formData.description,
					maxScore: parseInt(formData.maxScore),
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Error al crear la rúbrica");
			}

			const data = await response.json();

			// Add the new rubric to the list
			setRubricsList([...rubricsList, data.rubric]);

			// Reset form and close modal
			setFormData({
				name: "",
				description: "",
				maxScore: "100",
			});
			setShowCreateModal(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
		} finally {
			setIsLoading(false);
		}
	};

	// Handle criterion form submission
	const handleCriterionSubmit = async (e: Event) => {
		e.preventDefault();
		if (!selectedRubric) return;

		setIsLoading(true);
		setError(null);

		try {
			// Validate form data
			if (!criterionForm.name) {
				throw new Error("El nombre del criterio es obligatorio");
			}

			// Create criterion
			const response = await fetch("/api/rubric-criteria", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					rubricId: selectedRubric.id,
					name: criterionForm.name,
					description: criterionForm.description,
					weight: parseInt(criterionForm.weight),
					maxScore: parseInt(criterionForm.maxScore),
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Error al crear el criterio");
			}

			const data = await response.json();

			// Add the new criterion to the list
			setCriteria([...criteria, data.criterion]);

			// Reset form
			setCriterionForm({
				name: "",
				description: "",
				weight: "1",
				maxScore: "10",
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
		} finally {
			setIsLoading(false);
		}
	};

	// Load criteria for a rubric
	const loadCriteria = async (rubric: Rubric) => {
		setSelectedRubric(rubric);
		setError(null);

		try {
			const response = await fetch(
				`/api/rubric-criteria?rubricId=${rubric.id}`,
			);

			if (!response.ok) {
				throw new Error("Error al cargar los criterios");
			}

			const data = await response.json();
			setCriteria(data.criteria || []);
			setShowCriteriaModal(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
		}
	};

	// Delete a rubric
	const handleDeleteRubric = async (id: number) => {
		if (
			!confirm(
				"¿Estás seguro de que deseas eliminar esta rúbrica? Esta acción no se puede deshacer.",
			)
		) {
			return;
		}

		try {
			const response = await fetch(`/api/rubrics?id=${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Error al eliminar la rúbrica");
			}

			// Remove the rubric from the list
			setRubricsList(rubricsList.filter((rubric) => rubric.id !== id));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
		}
	};

	return (
		<div class="space-y-6">
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold">Rúbricas de Evaluación</h1>
					<p class="text-gray-500 dark:text-gray-400">
						Gestiona las rúbricas para evaluar proyectos y equipos
					</p>
				</div>

				<Button
					onClick={() => setShowCreateModal(true)}
					class="flex items-center justify-center gap-2"
				>
					<MaterialSymbol icon="add" />
					Nueva Rúbrica
				</Button>
			</div>

			{error && (
				<div
					class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:border-red-700 dark:text-red-300"
					role="alert"
				>
					<span class="block sm:inline">{error}</span>
				</div>
			)}

			{/* Rubrics list */}
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
				{rubricsList.length > 0 ? (
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
										Descripción
									</th>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
									>
										Puntuación Máxima
									</th>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
									>
										Fecha de Creación
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
								{rubricsList.map((rubric) => (
									<tr
										key={rubric.id}
										class="hover:bg-gray-50 dark:hover:bg-gray-700"
									>
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="text-sm font-medium text-gray-900 dark:text-white">
												{rubric.name}
											</div>
										</td>
										<td class="px-6 py-4">
											<div class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
												{rubric.description || "Sin descripción"}
											</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
											{rubric.maxScore} puntos
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
											{rubric.createdAt
												? new Date(rubric.createdAt).toLocaleDateString()
												: ""}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<button
												type="button"
												onClick={() => loadCriteria(rubric)}
												class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
											>
												Criterios
											</button>
											<button
												type="button"
												onClick={() => handleDeleteRubric(rubric.id)}
												class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
											>
												Eliminar
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div class="p-6 text-center">
						<p class="text-gray-500 dark:text-gray-400">
							No hay rúbricas disponibles. Crea una nueva para comenzar.
						</p>
					</div>
				)}
			</div>

			{/* Create Rubric Modal */}
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
							Nombre de la Rúbrica *
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

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Puntuación Máxima
						</label>
						<input
							type="number"
							name="maxScore"
							value={formData.maxScore}
							onChange={handleInputChange}
							min="1"
							max="1000"
							class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
						/>
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
							{isLoading ? "Creando..." : "Crear Rúbrica"}
						</Button>
					</div>
				</form>
			</Modal>

			{/* Criteria Modal */}
			<Modal
				show={showCriteriaModal}
				onClose={() => setShowCriteriaModal(false)}
			>
				<div class="space-y-6">
					{/* Criteria list */}
					<div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
						{criteria.length > 0 ? (
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
												Descripción
											</th>
											<th
												scope="col"
												class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
											>
												Peso
											</th>
											<th
												scope="col"
												class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
											>
												Puntuación Máxima
											</th>
										</tr>
									</thead>
									<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
										{criteria.map((criterion) => (
											<tr
												key={criterion.id}
												class="hover:bg-gray-50 dark:hover:bg-gray-700"
											>
												<td class="px-6 py-4 whitespace-nowrap">
													<div class="text-sm font-medium text-gray-900 dark:text-white">
														{criterion.name}
													</div>
												</td>
												<td class="px-6 py-4">
													<div class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
														{criterion.description || "Sin descripción"}
													</div>
												</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
													{criterion.weight}
												</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
													{criterion.maxScore} puntos
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<div class="p-6 text-center">
								<p class="text-gray-500 dark:text-gray-400">
									No hay criterios definidos para esta rúbrica. Añade criterios
									para comenzar.
								</p>
							</div>
						)}
					</div>

					{/* Add criterion form */}
					<div class="border-t pt-4 dark:border-gray-700">
						<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
							Añadir Nuevo Criterio
						</h3>

						<form onSubmit={handleCriterionSubmit} class="space-y-4">
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
									Nombre del Criterio *
								</label>
								<input
									type="text"
									name="name"
									value={criterionForm.name}
									onChange={handleCriterionInputChange}
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
									value={criterionForm.description}
									onChange={handleCriterionInputChange}
									rows={2}
									class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
								></textarea>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Peso
									</label>
									<input
										type="number"
										name="weight"
										value={criterionForm.weight}
										onChange={handleCriterionInputChange}
										min="1"
										max="100"
										class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
									/>
								</div>

								<div>
									<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Puntuación Máxima
									</label>
									<input
										type="number"
										name="maxScore"
										value={criterionForm.maxScore}
										onChange={handleCriterionInputChange}
										min="1"
										max="100"
										class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
									/>
								</div>
							</div>

							<div class="flex justify-end pt-2">
								<Button
									type="submit"
									disabled={isLoading}
									class={isLoading ? "opacity-70 cursor-not-allowed" : ""}
								>
									{isLoading ? "Añadiendo..." : "Añadir Criterio"}
								</Button>
							</div>
						</form>
					</div>

					<div class="flex justify-end pt-4 border-t dark:border-gray-700">
						<Button type="button" onClick={() => setShowCriteriaModal(false)}>
							Cerrar
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
