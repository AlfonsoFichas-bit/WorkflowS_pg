import { useState, useEffect } from "preact/hooks";
import type { JSX } from "preact";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import Modal from "../components/Modal.tsx";
import type { User } from "../utils/types.ts";
import { userStories } from "../src/db/schema/index.ts"; // Import the table object
import type { ProjectWithUserRole } from "../routes/dashboard/user-stories.tsx";
import { USER_STORY_PRIORITIES, UserStoryPriority, USER_STORY_STATUSES, UserStoryStatus, TODO, MEDIUM } from "../src/types/userStory.ts";
import { PROJECT_OWNER, SCRUM_MASTER } from "../src/types/roles.ts";

// Define the UserStory type using Drizzle's inference
type UserStory = typeof userStories.$inferSelect;

// Define an extended UserStory type that includes sprintName from API
export type UserStoryWithSprintName = UserStory & { sprintName?: string | null };

interface UserStoriesPageIslandProps {
  user: User;
  projects: ProjectWithUserRole[];
  initialStories: UserStoryWithSprintName[]; // Renamed from initialUserStories
  selectedProjectId: number | null;
}

type StoryFormData = {
  title: string;
  description: string;
  acceptanceCriteria: string;
  priority: UserStoryPriority;
  storyPoints: number | null;
};

export default function UserStoriesPageIsland(
  { user, projects, initialStories, selectedProjectId: initialSelectedProjectId }: UserStoriesPageIslandProps,
) {
  const [currentStories, setCurrentStories] = useState<UserStoryWithSprintName[]>(initialStories);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStory, setEditingStory] = useState<UserStoryWithSprintName | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(initialSelectedProjectId);

  const [formState, setFormState] = useState<StoryFormData>({
    title: "",
    description: "",
    acceptanceCriteria: "",
    priority: MEDIUM,
    storyPoints: null,
  });

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const canManageStories = activeProject?.userRole === PROJECT_OWNER || activeProject?.userRole === SCRUM_MASTER;

  // Filter state for sprint assignment
  const [sprintFilter, setSprintFilter] = useState<"all" | "backlog" | "assigned">("all");

  useEffect(() => {
    setCurrentStories(initialStories);
    setSelectedProjectId(initialSelectedProjectId);
  }, [initialStories, initialSelectedProjectId]);

  const fetchUserStories = async (projectId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/user-stories?projectId=${projectId}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to fetch user stories: ${response.statusText}`);
      }
      const data = await response.json();
      setCurrentStories(data.userStories || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      setCurrentStories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectChange = (e: JSX.TargetedEvent<HTMLSelectElement, Event>) => {
    const newProjectIdStr = (e.target as HTMLSelectElement).value;
    const newProjectId = newProjectIdStr ? Number.parseInt(newProjectIdStr, 10) : null;

    setSelectedProjectId(newProjectId);
    setSprintFilter("all"); // Reset filter when project changes
    history.pushState(null, "", newProjectId ? `/dashboard/user-stories?projectId=${newProjectId}` : "/dashboard/user-stories");

    if (newProjectId) {
      fetchUserStories(newProjectId);
    } else {
      setCurrentStories([]);
    }
  };

  const resetForm = () => {
    setFormState({
      title: "",
      description: "",
      acceptanceCriteria: "",
      priority: MEDIUM,
      storyPoints: null,
    });
  };

  const openCreateModal = () => {
    setEditingStory(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (story: UserStoryWithSprintName) => {
    setEditingStory(story);
    setFormState({
      title: story.title,
      description: story.description || "",
      acceptanceCriteria: story.acceptanceCriteria || "",
      priority: story.priority as UserStoryPriority,
      storyPoints: story.storyPoints || null,
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
    e.preventDefault();
    if (!selectedProjectId && !editingStory) {
      setError("No project selected for the new story.");
      return;
    }
    setIsLoading(true);
    setError(null);

    const storyDataForApi = {
      ...formState,
      storyPoints: formState.storyPoints ? Number(formState.storyPoints) : null,
    };

    try {
      let response;
      if (editingStory) {
        response = await fetch(`/api/user-stories/${editingStory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(storyDataForApi),
        });
      } else {
        response = await fetch(`/api/user-stories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...storyDataForApi, projectId: selectedProjectId }),
        });
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save user story");
      }

      setShowModal(false);
      const projectIdToRefresh = editingStory ? editingStory.projectId : selectedProjectId;
      if (projectIdToRefresh) {
        fetchUserStories(projectIdToRefresh);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStory = async (story: UserStoryWithSprintName) => {
    if (!confirm("Are you sure you want to delete this user story?")) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/user-stories/${story.id}`, { method: "DELETE" });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to delete user story");
      }
      fetchUserStories(story.projectId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, Event>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    setFormState(prev => ({ ...prev, [name]: name === 'storyPoints' ? (value === '' ? null : Number.parseInt(value, 10)) : value }));
  };

  const filteredStories = currentStories.filter(story => {
    if (sprintFilter === "backlog") return !story.sprintId;
    if (sprintFilter === "assigned") return !!story.sprintId;
    return true; // "all"
  });

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Historias de Usuario</h1>
        {canManageStories && selectedProjectId && (
          <button
            type="button"
            onClick={openCreateModal}
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            disabled={isLoading}
          >
            <MaterialSymbol icon="add" className="mr-1" />
            Crear Historia de Usuario
          </button>
        )}
      </div>

      <div class="md:flex md:items-end md:justify-between">
        <div class="flex-1 min-w-0">
            <label htmlFor="project-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Seleccionar Proyecto:
            </label>
            <select
            id="project-select"
            value={selectedProjectId || ""}
            onChange={handleProjectChange}
            disabled={isLoading}
            class="mt-1 block w-full md:max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
            <option value="">-- Seleccionar un Proyecto --</option>
            {projects.map((project) => (
                <option key={project.id} value={project.id}>
                {project.name} (Rol: {project.userRole})
                </option>
            ))}
            </select>
        </div>
        {selectedProjectId && (
        <div class="mt-4 md:mt-0 md:ml-4">
            <label htmlFor="sprint-filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por Sprint:</label>
            <select
                id="sprint-filter"
                value={sprintFilter}
                onChange={(e) => setSprintFilter((e.target as HTMLSelectElement).value as "all" | "backlog" | "assigned")}
                disabled={isLoading || !selectedProjectId}
                class="mt-1 block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
                <option value="all">Todas las Historias</option>
                <option value="backlog">Backlog (Sin asignar)</option>
                <option value="assigned">Asignadas a un Sprint</option>
            </select>
        </div>
        )}
      </div>

      {error && <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-800 dark:text-red-200" role="alert">{error}</div>}

      {isLoading && <div class="text-center py-4">Cargando historias... <MaterialSymbol icon="hourglass_empty" className="animate-spin"/></div>}

      {!isLoading && !error && selectedProjectId && filteredStories.length === 0 && (
        <p class="text-center py-4 text-gray-500 dark:text-gray-400">
            {sprintFilter === "all" && currentStories.length === 0 ? "No se encontraron historias de usuario para este proyecto. " : `No se encontraron historias de usuario para el filtro actual (${sprintFilter}). `}
            {canManageStories ? "¡Intenta crear una!" : ""}
        </p>
      )}

      {!isLoading && !error && selectedProjectId && filteredStories.length > 0 && (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStories.map((story) => {
            // Define color schemes based on priority
            const priorityColors = {
              high: {
                bg: "bg-red-50 dark:bg-red-900/20",
                border: "border-red-200 dark:border-red-800",
                text: "text-red-700 dark:text-red-300",
                icon: "text-red-500 dark:text-red-400",
                badge: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
              },
              medium: {
                bg: "bg-yellow-50 dark:bg-yellow-900/20",
                border: "border-yellow-200 dark:border-yellow-800",
                text: "text-yellow-700 dark:text-yellow-300",
                icon: "text-yellow-500 dark:text-yellow-400",
                badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
              },
              low: {
                bg: "bg-blue-50 dark:bg-blue-900/20",
                border: "border-blue-200 dark:border-blue-800",
                text: "text-blue-700 dark:text-blue-300",
                icon: "text-blue-500 dark:text-blue-400",
                badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
              }
            };

            // Get color scheme based on priority
            const colorScheme = priorityColors[story.priority.toLowerCase()] || priorityColors.medium;

            // Define status icon and color
            const getStatusInfo = (status) => {
              switch(status.toLowerCase()) {
                case 'todo':
                  return { icon: 'assignment', color: 'text-gray-500 dark:text-gray-400' };
                case 'in progress':
                  return { icon: 'pending', color: 'text-blue-500 dark:text-blue-400' };
                case 'review':
                  return { icon: 'rate_review', color: 'text-purple-500 dark:text-purple-400' };
                case 'done':
                  return { icon: 'task_alt', color: 'text-green-500 dark:text-green-400' };
                default:
                  return { icon: 'help_outline', color: 'text-gray-500 dark:text-gray-400' };
              }
            };

            const statusInfo = getStatusInfo(story.status);

            return (
              <div 
                key={story.id} 
                class={`rounded-lg shadow-md overflow-hidden border ${colorScheme.border} hover:shadow-lg transition-shadow duration-200`}
              >
                {/* Priority indicator at top */}
                <div class={`h-1.5 ${story.priority.toLowerCase() === 'high' ? 'bg-red-500' : story.priority.toLowerCase() === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>

                <div class={`p-4 ${colorScheme.bg}`}>
                  {/* Header with title and priority badge */}
                  <div class="flex justify-between items-start mb-3">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">{story.title}</h3>
                    <span class={`px-2 py-1 text-xs rounded-full font-medium ${colorScheme.badge}`}>
                      {story.priority}
                    </span>
                  </div>

                  {/* Story details */}
                  <div class="space-y-3">
                    {/* Sprint assignment */}
                    <div class="flex items-center">
                      <MaterialSymbol icon="sprint" class="mr-2 text-gray-500 dark:text-gray-400" />
                      <span class="text-sm text-gray-700 dark:text-gray-300">
                        {story.sprintName || (story.sprintId ? `Sprint ID ${story.sprintId}` : "Backlog")}
                      </span>
                    </div>

                    {/* Status with icon */}
                    <div class="flex items-center">
                      <MaterialSymbol icon={statusInfo.icon} class={`mr-2 ${statusInfo.color}`} />
                      <span class="text-sm text-gray-700 dark:text-gray-300">
                        {story.status}
                      </span>
                    </div>

                    {/* Story points */}
                    <div class="flex items-center">
                      <MaterialSymbol icon="star" class="mr-2 text-amber-500 dark:text-amber-400" />
                      <span class="text-sm text-gray-700 dark:text-gray-300">
                        {story.storyPoints !== null ? `${story.storyPoints} ${story.storyPoints === 1 ? 'punto' : 'puntos'}` : "Sin estimar"}
                      </span>
                    </div>

                    {/* Description preview if available */}
                    {story.description && (
                      <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {story.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {canManageStories && (
                    <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
                      <button 
                        type="button" 
                        onClick={() => openEditModal(story)} 
                        disabled={isLoading} 
                        class="p-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                        title="Editar"
                      >
                        <MaterialSymbol icon="edit" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteStory(story)} 
                        disabled={isLoading} 
                        class="p-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                        title="Eliminar"
                      >
                        <MaterialSymbol icon="delete" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal show={showModal} onClose={() => { if(!isLoading) setShowModal(false); }} maxWidth="2xl">
          <form onSubmit={handleFormSubmit} class="p-6 space-y-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{editingStory ? "Editar Historia de Usuario" : "Crear Historia de Usuario"}</h2>
            <div>
              <label htmlFor="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Título <span class="text-red-500">*</span></label>
              <input type="text" name="title" id="title" value={formState.title} onInput={handleInputChange} required disabled={isLoading}
                class="mt-1 block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label htmlFor="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
              <textarea name="description" id="description" value={formState.description} onInput={handleInputChange} rows={3} disabled={isLoading}
                class="mt-1 block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
            </div>
            <div>
              <label htmlFor="acceptanceCriteria" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Criterios de Aceptación</label>
              <textarea name="acceptanceCriteria" id="acceptanceCriteria" value={formState.acceptanceCriteria} onInput={handleInputChange} rows={3} disabled={isLoading}
                class="mt-1 block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
            </div>
            <div>
              <label htmlFor="priority" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Prioridad <span class="text-red-500">*</span></label>
              <select name="priority" id="priority" value={formState.priority} onChange={handleInputChange} required disabled={isLoading}
                class="mt-1 block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {USER_STORY_PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="storyPoints" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Puntos de Historia</label>
              <input type="number" name="storyPoints" id="storyPoints" value={formState.storyPoints ?? ""} onInput={handleInputChange} min="0" disabled={isLoading}
                class="mt-1 block w-full p-2.5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={() => setShowModal(false)} disabled={isLoading}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50">
                Cancelar
              </button>
              <button type="submit" disabled={isLoading}
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50">
                {isLoading ? (editingStory ? "Guardando..." : "Creando...") : (editingStory ? "Guardar Cambios" : "Crear Historia")}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
