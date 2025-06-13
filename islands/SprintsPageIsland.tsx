import { useEffect, useState } from "preact/hooks";
import type { JSX } from "preact";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import Modal from "../components/Modal.tsx";
import type { User } from "../utils/types.ts";
import { sprints } from "../src/db/schema/sprints.ts";
import { userStories } from "../src/db/schema/userStories.ts";
import type { ProjectWithUserRole } from "../routes/dashboard/sprints.tsx";
import {
  ACTIVE,
  COMPLETED,
  PLANNED,
  SPRINT_STATUSES,
  SprintStatus,
} from "../src/types/sprint.ts";
import { PROJECT_OWNER, SCRUM_MASTER } from "../src/types/roles.ts";

// Define types based on the schema tables
type Sprint = typeof sprints.$inferSelect;
type UserStory = typeof userStories.$inferSelect;

interface SprintsPageIslandProps {
  user: User;
  projects: ProjectWithUserRole[];
  initialSprints: Sprint[];
  selectedProjectId: number | null;
}


type SprintFormData =
  & Omit<
    Sprint,
    "id" | "createdAt" | "updatedAt" | "projectId" | "startDate" | "endDate"
  >
  & {
    projectId?: number;
    startDate?: string;
    endDate?: string;
  };

export default function SprintsPageIsland(
  { projects, initialSprints, selectedProjectId: initialSelectedProjectId }:
    SprintsPageIslandProps,
) {
  const [currentSprints, setCurrentSprints] = useState<Sprint[]>(
    initialSprints,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    initialSelectedProjectId,
  );

  // Create/Edit Sprint Modal
  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [sprintFormData, setSprintFormData] = useState<Partial<SprintFormData>>(
    { status: PLANNED },
  );

  // Assign User Stories Modal
  const [showAssignStoriesModal, setShowAssignStoriesModal] = useState(false);
  const [selectedSprintForAssignment, setSelectedSprintForAssignment] =
    useState<Sprint | null>(null);
  const [availableUserStories, setAvailableUserStories] = useState<UserStory[]>(
    [],
  );
  const [assignedUserStories, setAssignedUserStories] = useState<UserStory[]>(
    [],
  );

  const activeProject = projects.find((p) =>
    "id" in p && p.id === selectedProjectId
  );
  const canManageSprints = activeProject?.userRole === PROJECT_OWNER ||
    activeProject?.userRole === SCRUM_MASTER;

  useEffect(() => {
    setCurrentSprints(initialSprints);
    setSelectedProjectId(initialSelectedProjectId);
  }, [initialSprints, initialSelectedProjectId]);

  const fetchSprints = async (projectId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sprints?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error(
          (await response.json()).error || "Failed to fetch sprints",
        );
      }
      const data = await response.json();
      setCurrentSprints(data.sprints || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An unknown error occurred");
      setCurrentSprints([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectChange = (
    e: JSX.TargetedEvent<HTMLSelectElement, Event>,
  ) => {
    const newProjectIdStr = (e.target as HTMLSelectElement).value;
    const newProjectId = newProjectIdStr
      ? Number.parseInt(newProjectIdStr, 10)
      : null;
    setSelectedProjectId(newProjectId);
    history.pushState(
      null,
      "",
      newProjectId
        ? `/dashboard/sprints?projectId=${newProjectId}`
        : "/dashboard/sprints",
    );
    if (newProjectId) fetchSprints(newProjectId);
    else setCurrentSprints([]);
  };

  const handleSprintFormInputChange = (
    e: JSX.TargetedEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
      Event
    >,
  ) => {
    const { name, value } = e.target as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    setSprintFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateSprintModal = () => {
    setEditingSprint(null);
    setSprintFormData({
      name: "",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      status: PLANNED,
    });
    setShowCreateEditModal(true);
  };

  const openEditSprintModal = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setSprintFormData({
      name: sprint.name,
      description: sprint.description || "",
      startDate: sprint.startDate
        ? new Date(sprint.startDate).toISOString().split("T")[0]
        : "",
      endDate: sprint.endDate
        ? new Date(sprint.endDate).toISOString().split("T")[0]
        : "",
      status: sprint.status as SprintStatus,
    });
    setShowCreateEditModal(true);
  };

  const handleSprintFormSubmit = async (
    e: JSX.TargetedEvent<HTMLFormElement, Event>,
  ) => {
    e.preventDefault();
    if (!selectedProjectId && !editingSprint?.projectId) {
      setError("No hay contexto de proyecto para el sprint.");
      return;
    }
    setIsLoading(true);
    setError(null);

    const dataToSend = {
      ...sprintFormData,
      projectId: editingSprint ? editingSprint.projectId : selectedProjectId,
      startDate: sprintFormData.startDate
        ? new Date(sprintFormData.startDate)
        : undefined,
      endDate: sprintFormData.endDate
        ? new Date(sprintFormData.endDate)
        : undefined,
    };

    if (
      dataToSend.startDate && dataToSend.endDate &&
      dataToSend.endDate <= dataToSend.startDate
    ) {
      setError(
        "La fecha de finalización debe ser posterior a la fecha de inicio.",
      );
      setIsLoading(false);
      return;
    }

    try {
      const response = editingSprint
        ? await fetch(`/api/sprints/${editingSprint.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        })
        : await fetch(`/api/sprints`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        });
      if (!response.ok) {
        throw new Error(
          (await response.json()).error || "Failed to save sprint",
        );
      }

      setShowCreateEditModal(false);
      if (dataToSend.projectId) fetchSprints(dataToSend.projectId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSprint = async (sprint: Sprint) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar el sprint: ${sprint.name}? Las historias de usuario se moverán al backlog.`,
      )
    ) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sprints/${sprint.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(
          (await response.json()).error || "Failed to delete sprint",
        );
      }
      fetchSprints(sprint.projectId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectAndSprintStories = async (sprint: Sprint) => {
    // Fetch stories assigned to this sprint
    const assignedRes = await fetch(`/api/sprints/${sprint.id}/user-stories`);
    if (!assignedRes.ok) {
      throw new Error(
        (await assignedRes.json()).error || "Failed to fetch assigned stories",
      );
    }
    const assignedData = await assignedRes.json();
    const currentAssignedStories = assignedData.userStories || [];
    setAssignedUserStories(currentAssignedStories);

    // Fetch all stories for the project
    const projectStoriesRes = await fetch(
      `/api/user-stories?projectId=${sprint.projectId}`,
    );
    if (!projectStoriesRes.ok) {
      throw new Error(
        (await projectStoriesRes.json()).error ||
          "Failed to fetch project stories",
      );
    }
    const projectStoriesData = await projectStoriesRes.json();
    const allProjectStories: UserStory[] = projectStoriesData.userStories || [];

    // Available stories are those in the same project, not assigned to *any* sprint (sprintId is null)
    // OR those currently assigned to THIS sprint (so they can be unassigned)
    setAvailableUserStories(
      allProjectStories.filter((us) =>
        us.sprintId === null || us.sprintId === sprint.id
      ),
    );
  };

  const openAssignStoriesModal = async (sprint: Sprint) => {
    setSelectedSprintForAssignment(sprint);
    setIsLoading(true);
    setError(null);
    try {
      await fetchProjectAndSprintStories(sprint);
      setShowAssignStoriesModal(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoryAssignmentChange = async (
    storyId: number,
    isAssigning: boolean,
  ) => {
    if (!selectedSprintForAssignment) return;
    setIsLoading(true);
    setError(null);
    const currentSprintId = selectedSprintForAssignment.id;
    try {
      let response;
      if (isAssigning) {
        response = await fetch(`/api/sprints/${currentSprintId}/user-stories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userStoryId: storyId }),
        });
      } else {
        response = await fetch(
          `/api/sprints/${currentSprintId}/user-stories/${storyId}`,
          { method: "DELETE" },
        );
      }
      if (!response.ok) {
        throw new Error(
          (await response.json()).error ||
            `Failed to ${isAssigning ? "assign" : "unassign"} story`,
        );
      }

      await fetchProjectAndSprintStories(selectedSprintForAssignment); // Refresh lists in modal
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Sprints</h1>
        {canManageSprints && selectedProjectId && (
          <div class="flex space-x-2">
            <a
              href={`/dashboard/projects/${selectedProjectId}/sprints/planning`}
              class="btn-secondary"
            >
              <MaterialSymbol icon="calendar_month" class="mr-1" />{" "}
              Planificación de Sprint
            </a>
            <button
              type="button"
              onClick={openCreateSprintModal}
              class="btn-primary"
              disabled={isLoading}
            >
              <MaterialSymbol icon="add" class="mr-1" /> Crear Sprint
            </button>
          </div>
        )}
      </div>
      <div>
        <label
          htmlFor="project-select-sprint-page"
          class="block text-sm font-medium"
        >
          Seleccionar Proyecto:
        </label>
        <select
          id="project-select-sprint-page"
          value={selectedProjectId || ""}
          onChange={handleProjectChange}
          disabled={isLoading}
          class="mt-1 input-field w-full"
        >
          <option value="">-- Selecciona un Proyecto --</option>
          {projects.map((p) => {
            // Ensure p has id and name properties
            if (p && typeof p === "object" && "id" in p && "name" in p) {
              return (
                <option key={String(p.id)} value={String(p.id)}>
                  {String(p.name)} (Rol: {String(p.userRole)})
                </option>
              );
            }
            return null;
          })}
        </select>
      </div>

      {error && <div class="alert-danger" role="alert">{error}</div>}
      {isLoading && <div class="text-center py-4">Cargando...</div>}

      {!isLoading && !error && selectedProjectId &&
        currentSprints.length === 0 && (
        <p class="text-center py-4">
          No se encontraron sprints para este proyecto.{" "}
          {canManageSprints ? "¡Crea uno!" : ""}
        </p>
      )}
      {!isLoading && !error && selectedProjectId && currentSprints.length > 0 &&
        (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentSprints.map((sprint) => (
              <div
                key={sprint.id}
                class="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
              >
                {/* Status color bar at the top */}
                <div class={`h-2 ${
                  sprint.status === PLANNED
                    ? "bg-blue-500"
                    : sprint.status === ACTIVE
                    ? "bg-green-500"
                    : sprint.status === COMPLETED
                    ? "bg-purple-500"
                    : "bg-gray-500"
                }`}></div>

                <div class="p-5">
                  {/* Header with icon and title */}
                  <div class="flex items-center mb-4">
                    <div class={`p-2 rounded-full mr-3 ${
                      sprint.status === PLANNED
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : sprint.status === ACTIVE
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : sprint.status === COMPLETED
                        ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    }`}>
                      <MaterialSymbol icon={
                        sprint.status === PLANNED
                          ? "calendar_month"
                          : sprint.status === ACTIVE
                          ? "sprint"
                          : sprint.status === COMPLETED
                          ? "task_alt"
                          : "help"
                      } class="text-xl" />
                    </div>
                    <div>
                      <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                        {sprint.name}
                      </h3>
                      <div class="flex items-center mt-1">
                        <span
                          class={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                            sprint.status === PLANNED
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                              : sprint.status === ACTIVE
                              ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                              : sprint.status === COMPLETED
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {sprint.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sprint timeline visualization */}
                  <div class="mb-4">
                    <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>{new Date(sprint.startDate).toLocaleDateString()}</span>
                      <span>{new Date(sprint.endDate).toLocaleDateString()}</span>
                    </div>
                    <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      {(() => {
                        const today = new Date();
                        const start = new Date(sprint.startDate);
                        const end = new Date(sprint.endDate);
                        const total = end.getTime() - start.getTime();
                        let progress = 0;

                        if (sprint.status === COMPLETED) {
                          progress = 100;
                        } else if (today < start) {
                          progress = 0;
                        } else if (today > end) {
                          progress = 100;
                        } else {
                          progress = ((today.getTime() - start.getTime()) / total) * 100;
                        }

                        return (
                          <div 
                            class={`h-full ${
                              sprint.status === PLANNED
                                ? "bg-blue-500"
                                : sprint.status === ACTIVE
                                ? "bg-green-500"
                                : sprint.status === COMPLETED
                                ? "bg-purple-500"
                                : "bg-gray-500"
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Sprint duration info */}
                  <div class="grid grid-cols-2 gap-2 mb-4">
                    <div class="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg flex items-center">
                      <MaterialSymbol icon="calendar_today" class="mr-2 text-gray-500 dark:text-gray-400" />
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {(() => {
                          const start = new Date(sprint.startDate);
                          const end = new Date(sprint.endDate);
                          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                          return `${days} día${days !== 1 ? 's' : ''}`;
                        })()}
                      </span>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg flex items-center">
                      <MaterialSymbol icon="event" class="mr-2 text-gray-500 dark:text-gray-400" />
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {(() => {
                          const today = new Date();
                          const end = new Date(sprint.endDate);
                          if (sprint.status === COMPLETED) return "Completado";
                          if (today > end) return "Vencido";

                          const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          return daysLeft <= 0 ? "Hoy" : `${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`;
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex flex-wrap gap-2">
                      <a
                        href={`/dashboard/projects/${selectedProjectId}/sprints/${sprint.id}`}
                        class="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <MaterialSymbol icon="visibility" class="mr-1" />
                        Ver Detalles
                      </a>
                      {canManageSprints && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditSprintModal(sprint)}
                            class="inline-flex items-center px-3 py-1.5 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                            disabled={isLoading}
                          >
                            <MaterialSymbol icon="edit" class="mr-1" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSprint(sprint)}
                            class="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
                            disabled={isLoading}
                          >
                            <MaterialSymbol icon="delete" class="mr-1" />
                            Eliminar
                          </button>
                          <button
                            type="button"
                            onClick={() => openAssignStoriesModal(sprint)}
                            class="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-md hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 transition-colors"
                            disabled={isLoading}
                          >
                            <MaterialSymbol icon="assignment" class="mr-1" />
                            Gestionar Historias
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {showCreateEditModal && (
        <Modal
          show={showCreateEditModal}
          onClose={() => !isLoading && setShowCreateEditModal(false)}
          maxWidth="lg"
        >
          <form onSubmit={handleSprintFormSubmit} class="p-6 space-y-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              {editingSprint ? "Editar Sprint" : "Crear Sprint"}
            </h2>
            <div>
              <label
                htmlFor="sprint-name"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nombre <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="sprint-name"
                value={sprintFormData.name || ""}
                onInput={handleSprintFormInputChange}
                required
                disabled={isLoading}
                class="mt-1 input-field w-full"
              />
            </div>
            <div>
              <label
                htmlFor="sprint-description"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Descripción
              </label>
              <textarea
                name="description"
                id="sprint-description"
                value={sprintFormData.description || ""}
                onInput={handleSprintFormInputChange}
                rows={3}
                disabled={isLoading}
                class="mt-1 input-field w-full"
              >
              </textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sprint-startDate"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Fecha de Inicio <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  id="sprint-startDate"
                  value={sprintFormData.startDate?.toString() || ""}
                  onInput={handleSprintFormInputChange}
                  required
                  disabled={isLoading}
                  class="mt-1 input-field w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="sprint-endDate"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Fecha de Fin <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  id="sprint-endDate"
                  value={sprintFormData.endDate?.toString() || ""}
                  onInput={handleSprintFormInputChange}
                  required
                  disabled={isLoading}
                  class="mt-1 input-field w-full"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="sprint-status"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Estado <span class="text-red-500">*</span>
              </label>
              <select
                name="status"
                id="sprint-status"
                value={sprintFormData.status || PLANNED}
                onChange={handleSprintFormInputChange}
                required
                disabled={isLoading}
                class="mt-1 input-field w-full"
              >
                {SPRINT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateEditModal(false)}
                disabled={isLoading}
                class="btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" disabled={isLoading} class="btn-primary">
                {isLoading
                  ? "Guardando..."
                  : (editingSprint ? "Guardar Cambios" : "Crear Sprint")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showAssignStoriesModal && selectedSprintForAssignment && (
        <Modal
          show={showAssignStoriesModal}
          onClose={() => !isLoading && setShowAssignStoriesModal(false)}
          maxWidth="2xl"
        >
          <div class="p-6">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Gestionar Historias de Usuario para:{" "}
              {selectedSprintForAssignment.name}
            </h2>
            {error && <div class="alert-danger mb-4">{error}</div>}
            {isLoading && (
              <div class="text-center py-4">Cargando historias...</div>
            )}
            {!isLoading &&
              (
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 class="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">
                      Historias Disponibles (Backlog / Otros Sprints)
                    </h3>
                    <ul class="h-64 overflow-y-auto border rounded p-2 dark:border-gray-600 space-y-1 bg-gray-50 dark:bg-gray-700">
                      {availableUserStories.filter((us) =>
                        us.sprintId !== selectedSprintForAssignment.id
                      ).map((us) => (
                        <li
                          key={us.id}
                          class="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm text-gray-700 dark:text-gray-300"
                        >
                          <span>
                            {us.title} (SP: {us.storyPoints || "N/A"}){" "}
                            {us.sprintId ? "(En otro sprint)" : "(Backlog)"}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleStoryAssignmentChange(us.id, true)}
                            disabled={isLoading}
                            class="btn-primary btn-xs"
                          >
                            Asignar{" "}
                            <MaterialSymbol
                              icon="arrow_forward"
                              className="text-sm"
                            />
                          </button>
                        </li>
                      ))}
                      {availableUserStories.filter((us) =>
                            us.sprintId !== selectedSprintForAssignment.id
                          ).length === 0 && !isLoading && (
                        <p class="text-sm text-gray-500 dark:text-gray-400 p-2">
                          No hay historias disponibles.
                        </p>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 class="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">
                      Historias en este Sprint
                    </h3>
                    <ul class="h-64 overflow-y-auto border rounded p-2 dark:border-gray-600 space-y-1 bg-gray-50 dark:bg-gray-700">
                      {assignedUserStories.map((us) => (
                        <li
                          key={us.id}
                          class="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm text-gray-700 dark:text-gray-300"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleStoryAssignmentChange(us.id, false)}
                            disabled={isLoading}
                            class="btn-danger btn-xs"
                          >
                            <MaterialSymbol
                              icon="arrow_back"
                              className="text-sm"
                            />{" "}
                            Desasignar
                          </button>
                          <span>
                            {us.title} (SP: {us.storyPoints || "N/A"})
                          </span>
                        </li>
                      ))}
                      {assignedUserStories.length === 0 && !isLoading && (
                        <p class="text-sm text-gray-500 dark:text-gray-400 p-2">
                          No hay historias asignadas a este sprint.
                        </p>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            <div class="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowAssignStoriesModal(false)}
                disabled={isLoading}
                class="btn-secondary"
              >
                Listo
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
