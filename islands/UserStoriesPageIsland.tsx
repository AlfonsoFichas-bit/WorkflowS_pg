import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import { Modal } from "../components/Modal.tsx";

interface UserStory {
  id: number;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  projectId: number;
  sprintId: number | null;
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

interface Project {
  id: number;
  name: string;
}

interface Sprint {
  id: number;
  name: string;
  projectId: number;
}

interface UserStoriesPageIslandProps {
  user: User;
  userStories: UserStory[];
  projects: Project[];
  sprints: Sprint[];
  selectedProjectId?: number;
  selectedSprintId?: number;
}

export default function UserStoriesPageIsland({ 
  user, 
  userStories, 
  projects, 
  sprints, 
  selectedProjectId, 
  selectedSprintId 
}: UserStoriesPageIslandProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userStoriesList, setUserStoriesList] = useState<UserStory[]>(userStories);
  const [currentProject, setCurrentProject] = useState<number | undefined>(selectedProjectId);
  const [currentSprint, setCurrentSprint] = useState<number | undefined>(selectedSprintId);
  const [availableSprints, setAvailableSprints] = useState<Sprint[]>(sprints);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    acceptanceCriteria: "",
    projectId: selectedProjectId || "",
    sprintId: selectedSprintId || "",
    status: "pending",
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

    // If project changes, update available sprints
    if (name === "projectId" && value) {
      handleProjectChange(parseInt(value));
    }
  };

  // Handle project selection change for filtering
  const handleProjectFilterChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const projectId = target.value ? parseInt(target.value) : undefined;
    setCurrentProject(projectId);
    setCurrentSprint(undefined);
    
    // Redirect to the user stories page with the selected project
    if (projectId) {
      window.location.href = `/dashboard/user-stories?projectId=${projectId}`;
    } else {
      window.location.href = "/dashboard/user-stories";
    }
  };

  // Handle sprint selection change for filtering
  const handleSprintFilterChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const sprintId = target.value ? parseInt(target.value) : undefined;
    setCurrentSprint(sprintId);
    
    // Redirect to the user stories page with the selected sprint
    if (sprintId) {
      window.location.href = `/dashboard/user-stories?sprintId=${sprintId}`;
    } else if (currentProject) {
      window.location.href = `/dashboard/user-stories?projectId=${currentProject}`;
    } else {
      window.location.href = "/dashboard/user-stories";
    }
  };

  // Handle project change in form
  const handleProjectChange = async (projectId: number) => {
    try {
      // Fetch sprints for the selected project
      const response = await fetch(`/api/sprints?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error("Error al obtener los sprints del proyecto");
      }
      
      const data = await response.json();
      setAvailableSprints(data.sprints || []);
      
      // Reset sprint selection if the current sprint is not from this project
      const currentSprintBelongsToProject = data.sprints.some((sprint: Sprint) => sprint.id === currentSprint);
      if (!currentSprintBelongsToProject) {
        setFormData({
          ...formData,
          sprintId: ""
        });
      }
    } catch (err) {
      console.error("Error fetching sprints:", err);
      setAvailableSprints([]);
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
        throw new Error("El título de la historia de usuario es obligatorio");
      }
      if (!formData.projectId) {
        throw new Error("Debe seleccionar un proyecto");
      }

      // Create user story
      const response = await fetch("/api/user-stories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          acceptanceCriteria: formData.acceptanceCriteria,
          projectId: parseInt(formData.projectId.toString()),
          sprintId: formData.sprintId ? parseInt(formData.sprintId.toString()) : null,
          status: formData.status,
          priority: formData.priority,
          storyPoints: formData.storyPoints ? parseInt(formData.storyPoints.toString()) : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la historia de usuario");
      }

      const data = await response.json();
      
      // Add the new user story to the list
      setUserStoriesList([...userStoriesList, data.userStory]);
      
      // Reset form and close modal
      setFormData({
        title: "",
        description: "",
        acceptanceCriteria: "",
        projectId: selectedProjectId || "",
        sprintId: selectedSprintId || "",
        status: "pending",
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
      case "pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "in_progress":
        return "En progreso";
      case "completed":
        return "Completada";
      case "cancelled":
        return "Cancelada";
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

  return (
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold">Historias de Usuario</h1>
          <p class="text-gray-500 dark:text-gray-400">
            Gestiona las historias de usuario de tus proyectos
          </p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div class="w-full sm:w-64">
            <select
              class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              value={currentProject}
              onChange={handleProjectFilterChange}
            >
              <option value="">Todos los proyectos</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          {currentProject && (
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
          )}
          
          <Button
            onClick={() => setShowCreateModal(true)}
            class="flex items-center justify-center gap-2"
          >
            <MaterialSymbol icon="add" />
            Nueva Historia
          </Button>
        </div>
      </div>

      {/* User Stories list */}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {userStoriesList.length > 0 ? (
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
                {userStoriesList.map((story) => {
                  const project = projects.find(p => p.id === story.projectId);
                  const sprint = sprints.find(s => s.id === story.sprintId);
                  return (
                    <tr key={story.id} class="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">{story.title}</div>
                        {story.description && (
                          <div class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{story.description}</div>
                        )}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900 dark:text-white">{project?.name || `Proyecto ${story.projectId}`}</div>
                        {sprint && (
                          <div class="text-sm text-gray-500 dark:text-gray-400">{sprint.name}</div>
                        )}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(story.status)}`}>
                          {getStatusLabel(story.status)}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(story.priority)}`}>
                          {getPriorityLabel(story.priority)}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {story.storyPoints !== null ? story.storyPoints : '-'}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href={`/dashboard/user-stories/${story.id}`} class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4">
                          Ver
                        </a>
                        <button class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
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
                ? "No hay historias de usuario para este proyecto. Crea una nueva para comenzar." 
                : "No hay historias de usuario disponibles. Selecciona un proyecto o crea una nueva historia."}
            </p>
          </div>
        )}
      </div>

      {/* Create User Story Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nueva Historia de Usuario"
      >
        <form onSubmit={handleSubmit} class="space-y-4">
          {error && (
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">
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
              Sprint
            </label>
            <select
              name="sprintId"
              value={formData.sprintId}
              onChange={handleInputChange}
              class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            >
              <option value="">Sin sprint asignado</option>
              {availableSprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
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
              placeholder="Como [rol], quiero [funcionalidad] para [beneficio]"
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Criterios de Aceptación
            </label>
            <textarea
              name="acceptanceCriteria"
              value={formData.acceptanceCriteria}
              onChange={handleInputChange}
              rows={3}
              class="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              placeholder="- Dado [contexto], cuando [acción], entonces [resultado]"
            ></textarea>
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
                <option value="pending">Pendiente</option>
                <option value="in_progress">En progreso</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
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
              {isLoading ? "Creando..." : "Crear Historia"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}