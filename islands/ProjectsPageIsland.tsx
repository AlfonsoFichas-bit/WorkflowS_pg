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
            <div key={project.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {project.description || "Sin descripción"}
                </p>

                {/* Número de miembros del proyecto */}
                <div className="mb-4 flex items-center">
                  <MaterialSymbol icon="group" className="mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {project.members && project.members.length > 0
                      ? `${project.members.length} miembro${project.members.length !== 1 ? 's' : ''}`
                      : "Sin miembros"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Creado: {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                  <div className="flex space-x-2">
                    <a
                      href={`/dashboard/projects/${project.id}/members`}
                      className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 flex items-center"
                    >
                      <MaterialSymbol icon="group" className="mr-1" />
                      Ver Miembros
                    </a>
                    {(project.currentUserRole === PROJECT_OWNER || project.currentUserRole === SCRUM_MASTER) && (
                      <button
                        type="button"
                        onClick={() => openAddUserModal(project)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                      >
                        <MaterialSymbol icon="person_add" className="mr-1" />
                        Agregar Usuario
                      </button>
                    )}
                    {project.currentUserRole === PROJECT_OWNER && (
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center"
                      >
                        <MaterialSymbol icon="delete" className="mr-1" />
                        Eliminar
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
