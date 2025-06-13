import { useState } from "preact/hooks";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import Modal from "../components/Modal.tsx";
import CreateProjectFormIsland from "./CreateProjectFormIsland.tsx";
import AddUserToProjectIsland from "./AddUserToProjectIsland.tsx";
import type { ProjectRole } from "../src/types/roles.ts";
import { PROJECT_OWNER, SCRUM_MASTER } from "../src/types/roles.ts";

interface Project {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  currentUserRole?: ProjectRole | null; // Added from route
  members?: {
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
  }[];
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  formattedRole: string;
}

interface ProjectsPageIslandProps {
  user: User;
  projectsList: Project[];
}

export default function ProjectsPageIsland({ projectsList }: ProjectsPageIslandProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>(projectsList);

  // Función para crear un nuevo proyecto
  const handleCreateProject = async (projectData: { name: string; description: string }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/dashboard/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear el proyecto");
      }

      // Actualizar la lista de proyectos
      setProjects([...projects, data.project]);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "Error al crear el proyecto");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para agregar un usuario a un proyecto
  const handleAddUserToProject = async (userData: { userId: number; role: string }) => {
    if (!selectedProject) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/dashboard/projects/${selectedProject.id}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al agregar el usuario al proyecto");
      }

      // Actualizar la información del proyecto para mostrar el nuevo miembro
      const updatedProjectResponse = await fetch(`/dashboard/projects/${selectedProject.id}`);
      const updatedProjectData = await updatedProjectResponse.json();

      if (updatedProjectResponse.ok && updatedProjectData.project) {
        // Actualizar el proyecto en la lista de proyectos
        setProjects(projects.map(project => 
          project.id === selectedProject.id ? updatedProjectData.project : project
        ));
      }

      setShowAddUserModal(false);
      // Mostrar un mensaje de éxito
      alert("Usuario agregado/actualizado exitosamente en el proyecto. Recuerda que este rol es específico para este proyecto y no cambia el rol global del usuario.");
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "Error al crear el proyecto");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para abrir el modal de agregar usuario
  const openAddUserModal = (project: Project) => {
    setSelectedProject(project);
    setShowAddUserModal(true);
  };

  // Función para eliminar un proyecto
  const handleDeleteProject = async (projectId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer y los roles de los usuarios volverán a 'team_developer'.")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/dashboard/projects/${projectId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar el proyecto");
      }

      // Eliminar el proyecto de la lista
      setProjects(projects.filter(project => project.id !== projectId));
      alert("Proyecto eliminado exitosamente");
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "Error al eliminar el proyecto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Proyectos</h1>
        <button
            type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          onClick={() => setShowCreateModal(true)}
        >
          <MaterialSymbol icon="add" className="mr-1" />
          Nuevo Proyecto
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay proyectos disponibles</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
              <div className="h-3 bg-blue-600"></div>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                    <MaterialSymbol icon="folder" className="text-blue-600 dark:text-blue-300 text-2xl" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">{project.name}</h2>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
                  <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                    {project.description || "Sin descripción"}
                  </p>
                </div>

                {/* Estadísticas del proyecto */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg flex items-center">
                    <MaterialSymbol icon="group" className="mr-2 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {project.members && project.members.length > 0
                        ? `${project.members.length} miembro${project.members.length !== 1 ? 's' : ''}`
                        : "Sin miembros"}
                    </span>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg flex items-center">
                    <MaterialSymbol icon="calendar_today" className="mr-2 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acciones
                  </span>
                  <div className="flex space-x-2">
                    <a
                      href={`/dashboard/projects/${project.id}/members`}
                      className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"
                      title="Ver miembros"
                    >
                      <MaterialSymbol icon="group" />
                    </a>
                    {(project.currentUserRole === PROJECT_OWNER || project.currentUserRole === SCRUM_MASTER) && (
                      <button
                        type="button"
                        onClick={() => openAddUserModal(project)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                        title="Agregar usuario"
                      >
                        <MaterialSymbol icon="person_add" />
                      </button>
                    )}
                    {project.currentUserRole === PROJECT_OWNER && (
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                        title="Eliminar proyecto"
                      >
                        <MaterialSymbol icon="delete" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para crear proyecto */}
      <Modal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        maxWidth="md"
      >
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Crear Nuevo Proyecto
          </h2>
          <CreateProjectFormIsland
            onSubmit={handleCreateProject}
            onCancel={() => setShowCreateModal(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </Modal>

      {/* Modal para agregar usuario a proyecto */}
      <Modal
        show={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        maxWidth="md"
      >
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Agregar Usuario al Proyecto
          </h2>
          {selectedProject && (
            <AddUserToProjectIsland
              projectId={selectedProject.id}
              onSubmit={handleAddUserToProject}
              onCancel={() => setShowAddUserModal(false)}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
