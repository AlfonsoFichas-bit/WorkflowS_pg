import { useState, useEffect } from "preact/hooks";
import type { JSX } from "preact";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import type { User } from "../utils/types.ts";
import type { ProjectWithUserRole, UserStoryWithSprintName } from "../routes/dashboard/kanban.tsx";
import { TODO, IN_PROGRESS, REVIEW, DONE, USER_STORY_STATUSES } from "../src/types/userStory.ts";
import { PROJECT_OWNER, SCRUM_MASTER } from "../src/types/roles.ts";

interface KanbanBoardIslandProps {
  user: User;
  projects: ProjectWithUserRole[];
  initialStories: UserStoryWithSprintName[];
  selectedProjectId: number | null;
}

export default function KanbanBoardIsland({
  user,
  projects,
  initialStories,
  selectedProjectId: initialSelectedProjectId,
}: KanbanBoardIslandProps) {
  const [currentStories, setCurrentStories] = useState<UserStoryWithSprintName[]>(initialStories);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(initialSelectedProjectId);
  const [draggedStory, setDraggedStory] = useState<UserStoryWithSprintName | null>(null);

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const canManageStories = activeProject?.userRole === PROJECT_OWNER || activeProject?.userRole === SCRUM_MASTER;

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
    globalThis.history.pushState(null, "", newProjectId ? `/dashboard/kanban?projectId=${newProjectId}` : "/dashboard/kanban");

    if (newProjectId) {
      fetchUserStories(newProjectId);
    } else {
      setCurrentStories([]);
    }
  };

  const handleDragStart = (story: UserStoryWithSprintName) => {
    setDraggedStory(story);
  };

  const handleDragOver = (e: JSX.TargetedDragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: JSX.TargetedDragEvent<HTMLDivElement>, status: string) => {
    e.preventDefault();
    if (!draggedStory || !selectedProjectId) return;

    // If the status is the same, do nothing
    if (draggedStory.status === status) {
      setDraggedStory(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/user-stories/${draggedStory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update user story status');
      }

      // Actualizar la lista de historias en el estado local
      setCurrentStories(prev =>
        prev.map(story =>
          story.id === draggedStory.id
            ? { ...story, status: status as typeof story.status }
            : story
        )
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
      setDraggedStory(null);
    }
  };

  const getStoriesByStatus = (status: string) => {
    return currentStories.filter(story => story.status === status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TODO:
        return 'bg-gray-100 dark:bg-gray-700';
      case IN_PROGRESS:
        return 'bg-blue-100 dark:bg-blue-900';
      case REVIEW:
        return 'bg-yellow-100 dark:bg-yellow-900';
      case DONE:
        return 'bg-green-100 dark:bg-green-900';
      default:
        return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  const getStatusHeaderColor = (status: string) => {
    switch (status) {
      case TODO:
        return 'bg-gray-200 dark:bg-gray-600';
      case IN_PROGRESS:
        return 'bg-blue-200 dark:bg-blue-800';
      case REVIEW:
        return 'bg-yellow-200 dark:bg-yellow-800';
      case DONE:
        return 'bg-green-200 dark:bg-green-800';
      default:
        return 'bg-gray-200 dark:bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case TODO:
        return 'assignment';
      case IN_PROGRESS:
        return 'pending';
      case REVIEW:
        return 'rate_review';
      case DONE:
        return 'task_alt';
      default:
        return 'help';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case TODO:
        return 'Por hacer';
      case IN_PROGRESS:
        return 'En proceso';
      case REVIEW:
        return 'Revisión';
      case DONE:
        return 'Completado';
      default:
        return status;
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Tablero Kanban</h1>
        {selectedProjectId && (
          <a
            href={`/dashboard/user-stories?projectId=${selectedProjectId}`}
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <MaterialSymbol icon="list" class="mr-1" /> Vista de Lista
          </a>
        )}
      </div>

      <div>
        <label htmlFor="project-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Seleccionar Proyecto:
        </label>
        <select
          id="project-select"
          value={selectedProjectId || ""}
          onChange={handleProjectChange}
          disabled={isLoading}
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">-- Seleccionar un Proyecto --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-100 dark:border-red-700" role="alert">
          <span class="block sm:inline">{error}</span>
        </div>
      )}

      {isLoading && (
        <div class="flex justify-center items-center py-8">
          <MaterialSymbol icon="sync" class="animate-spin text-3xl text-blue-600 dark:text-blue-400" />
          <span class="ml-2">Cargando...</span>
        </div>
      )}

      {!isLoading && !error && selectedProjectId && (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {USER_STORY_STATUSES.map(status => (
            <div
              key={status}
              class={`rounded-lg shadow-md overflow-hidden ${getStatusColor(status)}`}
            >
              <div class={`p-3 ${getStatusHeaderColor(status)} flex items-center justify-between`}>
                <div class="flex items-center">
                  <MaterialSymbol icon={getStatusIcon(status)} class="mr-2" />
                  <h3 class="font-semibold">{formatStatus(status)}</h3>
                </div>
                <span class="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-semibold">
                  {getStoriesByStatus(status).length}
                </span>
              </div>
              <div
                class="p-2 min-h-[300px] max-h-[600px] overflow-y-auto"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                {getStoriesByStatus(status).length === 0 ? (
                  <div class="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                    <MaterialSymbol icon="inbox" class="text-3xl mb-2" />
                    <p class="text-sm">No hay historias en esta columna</p>
                  </div>
                ) : (
                  getStoriesByStatus(status).map(story => (
                    <div
                      key={story.id}
                      class="bg-white dark:bg-gray-800 p-3 rounded-md shadow mb-2 cursor-move"
                      draggable={canManageStories}
                      onDragStart={() => handleDragStart(story)}
                    >
                      <div class="flex justify-between items-start">
                        <h4 class="font-medium text-gray-900 dark:text-white">{story.title}</h4>
                        {story.storyPoints !== null && (
                          <span class="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-semibold">
                            {story.storyPoints} pts
                          </span>
                        )}
                      </div>
                      {story.description && (
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {story.description}
                        </p>
                      )}
                      {story.sprintName && (
                        <div class="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <MaterialSymbol icon="sprint" class="mr-1 text-xs" />
                          <span>{story.sprintName}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
