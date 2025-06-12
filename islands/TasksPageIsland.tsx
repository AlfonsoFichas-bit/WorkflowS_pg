import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import Modal from "../components/Modal.tsx";

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

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  formattedRole: string;
}

interface Sprint {
  id: number;
  name: string;
  projectId: number;
}

interface UserStory {
  id: number;
  title: string;
  projectId: number;
  sprintId: number | null;
}

interface Project {
  id: number;
  name: string;
}

interface TasksPageIslandProps {
  user: User;
  tasks: Task[];
  sprints: Sprint[];
  userStories: UserStory[];
  projects: Project[];
  selectedSprintId?: number;
  selectedAssigneeId?: number;
}

export default function TasksPageIsland({ 
  user, 
  tasks, 
  sprints, 
  userStories, 
  projects, 
  selectedSprintId, 
  selectedAssigneeId 
}: TasksPageIslandProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasksList, setTasksList] = useState<Task[]>(tasks);
  const [currentSprint, setCurrentSprint] = useState<number | undefined>(selectedSprintId);
  const [currentAssignee, setCurrentAssignee] = useState<number | undefined>(selectedAssigneeId);
  const [availableUserStories, setAvailableUserStories] = useState<UserStory[]>(
    selectedSprintId 
      ? userStories.filter(story => story.sprintId === selectedSprintId)
      : userStories
  );

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sprintId: selectedSprintId || "",
    userStoryId: "",
    assigneeId: "",
    status: "todo",
    priority: "medium",
    storyPoints: ""
  });

  // Handle form input changes
  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const value = target.value;
    const name = target.name;

    setFormData({
      ...formData,
      [name]: value
    });

    // If sprint changes, update available user stories
    if (name === "sprintId" && value) {
      handleSprintChange(Number.parseInt(value));
    }
  };

  // Handle sprint selection change for filtering
  const handleSprintFilterChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const sprintId = target.value ? Number.parseInt(target.value) : undefined;
    setCurrentSprint(sprintId);
    
    // Redirect to the tasks page with the selected sprint
    if (sprintId) {
      window.location.href = `/dashboard/tasks?sprintId=${sprintId}`;
    } else {
      window.location.href = "/dashboard/tasks";
    }
  };

  // Handle assignee selection change for filtering
  const handleAssigneeFilterChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const assigneeId = target.value ?Number.parseInt(target.value) : undefined;
    setCurrentAssignee(assigneeId);
    
    // Redirect to the tasks page with the selected assignee
    if (assigneeId) {
      window.location.href = `/dashboard/tasks?assigneeId=${assigneeId}`;
    } else {
      window.location.href = "/dashboard/tasks";
    }
  };

  // Handle sprint change in form
  const handleSprintChange = async (sprintId: number) => {
    try {
      // Fetch user stories for the selected sprint
      const response = await fetch(`/api/user-stories?sprintId=${sprintId}`);
      if (!response.ok) {
        throw new Error("Error al obtener las historias de usuario del sprint");
      }
      
      const data = await response.json();
      setAvailableUserStories(data.userStories || []);
      
      // Reset user story selection
      setFormData({
        ...formData,
        userStoryId: ""
      });
    } catch (err) {
      console.error("Error fetching user stories:", err);
      setAvailableUserStories([]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate form data
      if (!formData.title) {
        throw new Error("El título de la tarea es obligatorio");
      }

      // Create task
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          sprintId: formData.sprintId ?Number.parseInt(formData.sprintId.toString()) : null,
          assigneeId: formData.assigneeId ?Number.parseInt(formData.assigneeId.toString()) : null,
          status: formData.status,
          priority: formData.priority,
          storyPoints: formData.storyPoints ?Number.parseInt(formData.storyPoints.toString()) : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la tarea");
      }

      const data = await response.json();
      
      // Add the new task to the list
      setTasksList([...tasksList, data.task]);
      
      // Reset form and close modal
      setFormData({
        title: "",
        description: "",
        sprintId: selectedSprintId || "",
        userStoryId: "",
        assigneeId: "",
        status: "todo",
        priority: "medium",
        storyPoints: ""
      });
      setShowCreateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "done":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return "Por hacer";
      case "in_progress":
        return "En progreso";
      case "done":
        return "Completada";
      case "blocked":
        return "Bloqueada";
      default:
        return status;
    }
  };

  // Get priority badge class
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Get priority label
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baja";
      default:
        return priority;
    }
  };

  // Get sprint name by ID
  const getSprintName = (sprintId: number | null) => {
    if (!sprintId) return "Sin sprint";
    const sprint = sprints.find(s => s.id === sprintId);
    return sprint ? sprint.name : `Sprint ${sprintId}`;
  };

  // Get project name by sprint ID
  const getProjectName = (sprintId: number | null) => {
    if (!sprintId) return "";
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return "";
    const project = projects.find(p => p.id === sprint.projectId);
    return project ? project.name : `Proyecto ${sprint.projectId}`;
  };

  return (
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold">Tareas</h1>
          <p class="text-gray-500 dark:text-gray-400">
            Gestiona las tareas de tus proyectos
          </p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div class="w-full sm:w-64">
            <select
              class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              value={currentSprint}
              onChange={handleSprintFilterChange}
            >
              <option value="">Todos los sprints</option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </div>
          
          <div class="w-full sm:w-64">
            <select
              class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              value={currentAssignee}
              onChange={handleAssigneeFilterChange}
            >
              <option value="">Todos los asignados</option>
              <option value={user.id}>Mis tareas</option>
            </select>
          </div>
          
          <Button
            onClick={() => setShowCreateModal(true)}
            class="flex items-center justify-center gap-2"
          >
            <MaterialSymbol icon="add" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Tasks list */}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {tasksList.length > 0 ? (
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Título
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Proyecto / Sprint
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Puntos
                  </th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tasksList.map((task) => (
                  <tr key={task.id} class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">{task.title}</div>
                      {task.description && (
                        <div class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{task.description}</div>
                      )}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900 dark:text-white">{getProjectName(task.sprintId)}</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">{getSprintName(task.sprintId)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {task.storyPoints !== null ? task.storyPoints : '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href={`/dashboard/tasks/${task.id}`} class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4">
                        Ver
                      </a>
                      <button type="button" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
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
              {currentSprint 
                ? "No hay tareas para este sprint. Crea una nueva para comenzar." 
                : currentAssignee
                  ? "No hay tareas asignadas. Crea una nueva o asígnate una existente."
                  : "No hay tareas disponibles. Crea una nueva para comenzar."}
            </p>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nueva Tarea"
      >
        <form onSubmit={handleSubmit} class="space-y-4">
          {error && (
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">
              <span class="block sm:inline">{error}</span>
            </div>
          )}
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sprint
            </label>
            <select
              name="sprintId"
              value={formData.sprintId}
              onChange={handleInputChange}
              class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            >
              <option value="">Sin sprint asignado</option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Historia de Usuario
            </label>
            <select
              name="userStoryId"
              value={formData.userStoryId}
              onChange={handleInputChange}
              class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            >
              <option value="">Sin historia de usuario</option>
              {availableUserStories.map((story) => (
                <option key={story.id} value={story.id}>
                  {story.title}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
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
              Asignado a
            </label>
            <select
              name="assigneeId"
              value={formData.assigneeId}
              onChange={handleInputChange}
              class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            >
              <option value="">Sin asignar</option>
              <option value={user.id}>{user.name} (Yo)</option>
            </select>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <option value="todo">Por hacer</option>
                <option value="in_progress">En progreso</option>
                <option value="done">Completada</option>
                <option value="blocked">Bloqueada</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prioridad
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              >
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Puntos de Historia
              </label>
              <input
                type="number"
                name="storyPoints"
                value={formData.storyPoints}
                onChange={handleInputChange}
                min="0"
                max="100"
                class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>
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
              {isLoading ? "Creando..." : "Crear Tarea"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}