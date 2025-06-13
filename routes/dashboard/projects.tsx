import { DashboardLayout } from "../../components/DashboardLayout.tsx";
import type { Handlers, PageProps } from "$fresh/server.ts";
import type { State } from "./_middleware.ts";
import { createProject, getAllProjects, getUserById, getProjectById, createTeamMember, getTeamsByProjectId, createTeam, getProjectMembers, deleteProject, updateUser, getAllUsers } from "../../utils/db.ts";
import ProjectsPageIsland from "../../islands/ProjectsPageIsland.tsx";
import { PROJECT_ROLES, ProjectRole, PROJECT_OWNER, SCRUM_MASTER } from "../../src/types/roles.ts";
import { hasProjectPermission, getProjectUserRole } from "../../src/utils/permissions.ts";

interface Project {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  createdAt: Date | null;
  updatedAt: Date | null;
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
  }[]; // Miembros del proyecto
  currentUserRole?: ProjectRole | null; // Rol del usuario actual en el proyecto
}

interface ProjectsData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    formattedRole: string;
  };
  projectsList: Project[];
}

export const handler: Handlers<ProjectsData, State> = {
  async GET(_req, ctx) {
    // El middleware ya ha verificado la autenticación y ha añadido el usuario al estado
    const currentUserId = ctx.state.user.id;

    // Obtener la lista de proyectos
    const projectsList = await getAllProjects();

    // Augmentar cada proyecto con los miembros y el rol del usuario actual
    const augmentedProjects = await Promise.all(
      projectsList.map(async (project) => {
        const members = await getProjectMembers(project.id);
        const currentUserRole = await getProjectUserRole(currentUserId, project.id);
        return {
          ...project,
          members,
          currentUserRole, // Rol del usuario actual en este proyecto
        };
      })
    );

    return ctx.render({
      user: ctx.state.user,
      projectsList: augmentedProjects,
    });
  },

  async POST(req, ctx) {
    try {
      const formData = await req.json();
      const { name, description } = formData;

      // Crear el proyecto utilizando la función del servicio
      const newProject = await createProject({
        name,
        description,
        ownerId: ctx.state.user.id,
      });

      return new Response(JSON.stringify({ success: true, project: newProject[0] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al crear proyecto:", error);

      return new Response(JSON.stringify({ error: "Error al crear el proyecto" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
};

// Manejador para obtener usuarios disponibles para agregar a proyectos
export const availableUsersHandler: Handlers<unknown, State> = {
  async GET(_req, ctx) {
    try {
      // Obtener todos los usuarios excepto el actual
      const allUsers = await getAllUsers();
      // ctx.state.user is guaranteed by middleware for dashboard routes
      const currentUserId = ctx.state.user.id;
      const users = allUsers.filter(user => user.id !== currentUserId);

      return new Response(JSON.stringify({ users }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al obtener usuarios:", error);

      return new Response(JSON.stringify({ error: "Error al obtener usuarios" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
};

// Manejador para eliminar un proyecto
export const deleteProjectHandler: Handlers<unknown, State> = {
  async DELETE(_req, ctx) {
    try {
      const projectId = Number.parseInt(ctx.params.id);
      const userId = ctx.state.user.id; // Already correctly accessed

      if (Number.isNaN(projectId)) {
        return new Response(JSON.stringify({ error: "ID de proyecto inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verificar permisos
      const canDelete = await hasProjectPermission(userId, projectId, [PROJECT_OWNER]);
      if (!canDelete) {
        return new Response(JSON.stringify({ error: "No tienes permiso para eliminar este proyecto" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verificar que el proyecto existe
      const project = await getProjectById(projectId);
      if (!project || project.length === 0) {
        return new Response(JSON.stringify({ error: "Proyecto no encontrado" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Obtener los miembros del proyecto antes de eliminarlo
      const members = await getProjectMembers(projectId);

      // Eliminar el proyecto
      const deletedProject = await deleteProject(projectId);

      // Resetear el rol de los usuarios a "team_developer"
      for (const member of members) {
        await updateUser(member.userId, { role: "team_developer" });
      }

      return new Response(JSON.stringify({ success: true, project: deletedProject[0] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al eliminar proyecto:", error);

      return new Response(JSON.stringify({ error: "Error al eliminar el proyecto" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
};

export const addUserToProjectHandler: Handlers<unknown, State> = {
  async POST(req, ctx) {
    try {
      const projectId = Number.parseInt(ctx.params.id);
      const currentUserId = ctx.state.user.id; // Already correctly accessed
      const { userId, role }: { userId: number; role: ProjectRole } = await req.json();

      // Verificar permisos para agregar usuarios
      const canAddUsers = await hasProjectPermission(currentUserId, projectId, [PROJECT_OWNER, SCRUM_MASTER]);
      if (!canAddUsers) {
        return new Response(JSON.stringify({ error: "No tienes permiso para agregar usuarios a este proyecto" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!PROJECT_ROLES.includes(role)) {
        return new Response(JSON.stringify({ error: "Rol inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (Number.isNaN(projectId)) {
        return new Response(JSON.stringify({ error: "ID de proyecto inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verificar que el proyecto existe
      const project = await getProjectById(projectId);
      if (!project || project.length === 0) {
        return new Response(JSON.stringify({ error: "Proyecto no encontrado" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verificar que el usuario existe
      const user = await getUserById(userId);
      if (!user || user.length === 0) {
        return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Obtener o crear un equipo para el proyecto
      const teams = await getTeamsByProjectId(projectId);
      let teamId: number;

      if (teams && teams.length > 0) {
        // Usar el primer equipo existente
        teamId = teams[0].id;
      } else {
        // Crear un nuevo equipo para el proyecto
        const newTeam = await createTeam({
          name: `Equipo del proyecto ${projectId}`,
          projectId,
        });
        teamId = newTeam[0].id;
      }

      // Agregar el usuario al equipo con el rol especificado
      const teamMember = await createTeamMember({
        userId,
        teamId,
        role,
      });

      return new Response(JSON.stringify({ success: true, teamMember: teamMember[0] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al agregar usuario al proyecto:", error);

      return new Response(JSON.stringify({ error: "Error al agregar usuario al proyecto" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
};

export default function Projects({ data }: PageProps<ProjectsData>) {
  const { user, projectsList } = data;

  return (
    <DashboardLayout user={user}>
      <div class="p-6">
        <ProjectsPageIsland user={user} projectsList={projectsList} />
      </div>
    </DashboardLayout>
  );
}
