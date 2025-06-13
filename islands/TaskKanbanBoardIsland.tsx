import { useState, useEffect } from "preact/hooks";
import type { JSX } from "preact";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import { TODO, IN_PROGRESS, DONE, BLOCKED, TASK_STATUSES } from "../src/types/task.ts";

interface Task {
  id: number;
  title: string;
  description: string | null;
  sprintId: number | null;
  assigneeId: number | null;
  status: string;
  priority: string;
  storyPoints: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface Sprint {
  id: number;
  name: string;
  projectId: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  formattedRole: string;
}

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

interface TaskKanbanBoardIslandProps {
  user: User;
  tasks: Task[];
  sprints: Sprint[];
  projectMembers: Member[];
  selectedSprintId?: number;
}

export default function TaskKanbanBoardIsland({
  user,
  tasks: initialTasks,
  sprints,
  projectMembers,
  selectedSprintId: initialSelectedSprintId,
}: TaskKanbanBoardIslandProps) {
  const [currentTasks, setCurrentTasks] = useState<Task[]>(initialTasks);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<number | undefined>(initialSelectedSprintId);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  useEffect(() => {
    setCurrentTasks(initialTasks);
    setSelectedSprintId(initialSelectedSprintId);
  }, [initialTasks, initialSelectedSprintId]);

  const fetchTasks = async (sprintId?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = '/api/tasks';
      if (sprintId) {
        url += `?sprintId=${sprintId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to fetch tasks: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCurrentTasks(data.tasks || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      setCurrentTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSprintChange = (e: JSX.TargetedEvent<HTMLSelectElement, Event>) => {
    const newSprintIdStr = (e.target as HTMLSelectElement).value;
    const newSprintId = newSprintIdStr ? Number.parseInt(newSprintIdStr, 10) : undefined;

    setSelectedSprintId(newSprintId);
    
    if (newSprintId) {
      window.location.href = `/dashboard/tasks/kanban?sprintId=${newSprintId}`;
    } else {
      window.location.href = "/dashboard/tasks/kanban";
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: JSX.TargetedDragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: JSX.TargetedDragEvent<HTMLDivElement>, status: string) => {
    e.preventDefault();
    if (!draggedTask) return;

    // If the status is the same, do nothing
    if (draggedTask.status === status) {
      setDraggedTask(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks?id=${draggedTask.id}`, {
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
        throw new Error(errData.error || 'Failed to update task status');
      }

      // Update the task list in local state
      setCurrentTasks(prev =>
        prev.map(task =>
          task.id === draggedTask.id
            ? { ...task, status }
            : task
        )
      );
      
      setSuccess(`Tarea "${draggedTask.title}" movida a ${getStatusLabel(status)}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
      setDraggedTask(null);
    }
  };

  const getTasksByStatus = (status: string) => {
    return currentTasks.filter(task => task.status === status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TODO:
        return 'bg-gray-100 dark:bg-gray-700';
      case IN_PROGRESS:
        return 'bg-blue-100 dark:bg-blue-900';
      case DONE:
        return 'bg-green-100 dark:bg-green-900';
      case BLOCKED:
        return 'bg-red-100 dark:bg-red-900';
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
      case DONE:
        return 'bg-green-200 dark:bg-green-800';
      case BLOCKED:
        return 'bg-red-200 dark:bg-red-800';
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
      case DONE:
        return 'task_alt';
      case BLOCKED:
        return 'block';
      default:
        return 'help';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case TODO:
        return 'Por hacer';
      case IN_PROGRESS:
        return 'En progreso';
      case DONE:
        return 'Completada';
      case BLOCKED:
        return 'Bloqueada';
      default:
        return status;
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "high":
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case "medium":
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case "low":
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return 'Alta';
      case "medium":
        return 'Media';
      case "low":
        return 'Baja';
      default:
        return priority;
    }
  };

  const getSprintName = (sprintId: number | null) => {
    if (!sprintId) return "Sin sprint";
    const sprint = sprints.find(s => s.id === sprintId);
    return sprint ? sprint.name : `Sprint ${sprintId}`;
  };

  const getAssigneeName = (assigneeId: number | null) => {
    if (!assigneeId) return "Sin asignar";
    
    // Si es el usuario actual
    if (assigneeId === user.id) {
      return `${user.name} (Yo)`;
    }
    
    // Buscar en los miembros del proyecto
    if (projectMembers && projectMembers.length > 0) {
      const assignee = projectMembers.find(member => member.user.id === assigneeId);
      if (assignee) {
        return assignee.user.name;
      }
    }
    
    return `Usuario #${assigneeId}`;
  };

  return (
    <div class="space-y-6">
      {success && (
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative dark:bg-green-900 dark:border-green-700 dark:text-green-300" role="alert">
          <span class="block sm:inline">{success}</span>
          <button 
            type="button" 
            class="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setSuccess(null)}
          >
            <MaterialSymbol icon="close" />
          </button>
        </div>
      )}
      
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Tablero Kanban de Tareas</h1>
        <div class="flex space-x-2">
          <a
            href="/dashboard/tasks"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <MaterialSymbol icon="list" class="mr-1" /> Vista de Lista
          </a>
        </div>
      </div>

      <div>
        <label htmlFor="sprint-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Seleccionar Sprint:
        </label>
        <select
          id="sprint-select"
          value={selectedSprintId || ""}
          onChange={handleSprintChange}
          disabled={isLoading}
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">-- Todos los sprints --</option>
          {sprints.map((sprint) => (
            <option key={sprint.id} value={sprint.id}>
              {sprint.name}
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

      {!isLoading && !error && (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TASK_STATUSES.map(status => (
            <div
              key={status}
              class={`rounded-lg shadow-md overflow-hidden ${getStatusColor(status)}`}
            >
              <div class={`p-3 ${getStatusHeaderColor(status)} flex items-center justify-between`}>
                <div class="flex items-center">
                  <MaterialSymbol icon={getStatusIcon(status)} class="mr-2" />
                  <h3 class="font-semibold">{getStatusLabel(status)}</h3>
                </div>
                <span class="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-semibold">
                  {getTasksByStatus(status).length}
                </span>
              </div>
              <div
                class="p-2 min-h-[300px] max-h-[600px] overflow-y-auto"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                {getTasksByStatus(status).length === 0 ? (
                  <div class="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                    <MaterialSymbol icon="inbox" class="text-3xl mb-2" />
                    <p class="text-sm">No hay tareas en esta columna</p>
                  </div>
                ) : (
                  getTasksByStatus(status).map(task => (
                    <div
                      key={task.id}
                      class="bg-white dark:bg-gray-800 p-3 rounded-md shadow mb-2 cursor-move"
                      draggable={true}
                      onDragStart={() => handleDragStart(task)}
                    >
                      <div class="flex justify-between items-start">
                        <h4 class="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                        <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                      {task.description && (
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div class="mt-2 flex flex-col text-xs text-gray-500 dark:text-gray-400">
                        <div class="flex items-center">
                          <MaterialSymbol icon="sprint" class="mr-1 text-xs" />
                          <span>{getSprintName(task.sprintId)}</span>
                        </div>
                        <div class="flex items-center mt-1">
                          <MaterialSymbol icon="person" class="mr-1 text-xs" />
                          <span>{getAssigneeName(task.assigneeId)}</span>
                        </div>
                        {task.storyPoints !== null && (
                          <div class="flex items-center mt-1">
                            <MaterialSymbol icon="star" class="mr-1 text-xs" />
                            <span>{task.storyPoints} puntos</span>
                          </div>
                        )}
                      </div>
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