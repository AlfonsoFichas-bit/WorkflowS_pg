import type { useState } from "preact/hooks";
import { MaterialSymbol } from "../components/MaterialSymbol.tsx";
import { DEVELOPER, PROJECT_OWNER, SCRUM_MASTER, ProjectRole } from "../src/types/roles.ts"; // Added ProjectRole

interface Member {
  id: number;
  userId: number;
  teamId: number;
  role: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string; // Global role of the user
  };
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  members: Member[];
  currentUserRole?: ProjectRole | null; // Role of the logged-in user for THIS project
}

interface ProjectMembersIslandProps {
  project: Project;
  currentUser: { // Logged-in user's global details
    id: number;
    name: string;
    email: string;
    role: string; // Global role
  };
}

export default function ProjectMembersIsland({ project, currentUser }: ProjectMembersIslandProps) {
  const formatRole = (role: string): string => {
    const roleMap: Record<string, string> = {
      [PROJECT_OWNER]: "Project Owner",
      [SCRUM_MASTER]: "Scrum Master",
      [DEVELOPER]: "Developer",
      "admin": "Administrador", // Keep existing global roles if needed
      "team_developer": "Team Developer", // Keep existing global roles if needed
    };

    return roleMap[role] || role;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6"> {/* Added mb-6 for spacing */}
        <h1 className="text-2xl font-bold">Miembros del Proyecto: {project.name}</h1>
        <div class="flex space-x-2"> {/* Wrapper for buttons */}
          {(project.currentUserRole === PROJECT_OWNER || project.currentUserRole === SCRUM_MASTER) && (
            <button
              type="button"
              // onClick={() => setShowAddMemberModal(true)} // Assuming a modal would be used
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <MaterialSymbol icon="person_add" className="mr-1" />
              Agregar Miembro
            </button>
          )}
          <a
            href="/dashboard/projects"
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-md flex items-center"
          >
            <MaterialSymbol icon="arrow_back" className="mr-1" />
            Volver a Proyectos
          </a>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {project.members && project.members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Correo electrónico
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rol en el Proyecto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rol Global
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {project.members.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {member.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {member.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className={`px-2 py-1 rounded text-xs ${
                        member.role === PROJECT_OWNER
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : member.role === SCRUM_MASTER
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : member.role === DEVELOPER
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" // Default style
                      }`}>
                        {formatRole(member.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {/* Display global role - this part remains unchanged */}
                      <span className={`px-2 py-1 rounded text-xs ${
                        member.user.role === "admin"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : member.user.role === "product_owner" // Example, adjust if global roles differ
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : member.user.role === "scrum_master" // Example, adjust if global roles differ
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" // Default for other global roles
                      }`}>
                        {formatRole(member.user.role)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Este proyecto no tiene miembros asignados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}