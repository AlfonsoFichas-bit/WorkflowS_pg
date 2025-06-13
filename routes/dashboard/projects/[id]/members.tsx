import { DashboardLayout } from "../../../../components/DashboardLayout.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import { State } from "../../_middleware.ts";
import { getProjectById, getProjectMembers } from "../../../../utils/db.ts";
import ProjectMembersIsland from "../../../../islands/ProjectMembersIsland.tsx";
import { getProjectUserRole } from "../../../../src/utils/permissions.ts";
import type { ProjectRole } from "../../../../src/types/roles.ts";

interface Project {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  members: {
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
  currentUserRole?: ProjectRole | null; // Added for permission checking
}

interface ProjectMembersData {
  user: { // This is the logged-in user from ctx.state.user
    id: number;
    name: string;
    email: string;
    role: string; // Global role
    formattedRole: string;
  };
  project: Project; // Project details including members and current user's role in THIS project
}

export const handler: Handlers<ProjectMembersData, State> = {
  async GET(_req, ctx) {
    try {
      const projectId = Number.parseInt(ctx.params.id);
      const currentUserId = ctx.state.user.id;

      if (Number.isNaN(projectId)) {
        return ctx.renderNotFound();
      }

      // Obtener el proyecto
      const projectResult = await getProjectById(projectId);
      if (!projectResult || projectResult.length === 0) {
        return ctx.renderNotFound();
      }

      const projectBase = projectResult[0];

      // Obtener los miembros del proyecto
      const members = await getProjectMembers(projectId);
      // Obtener el rol del usuario actual para este proyecto
      const currentUserRoleForProject = await getProjectUserRole(currentUserId, projectId);

      // Combinar el proyecto con sus miembros y el rol del usuario actual
      const projectWithDetails = {
        ...projectBase,
        members,
        currentUserRole: currentUserRoleForProject,
      };

      return ctx.render({
        user: ctx.state.user, // Logged-in user's global details
        project: projectWithDetails,
      });
    } catch (error) {
      console.error("Error al obtener proyecto:", error);
      return ctx.render({
        user: ctx.state.user,
        project: {
          id: 0,
          name: "Error",
          description: "Error loading project",
          ownerId: 0,
          createdAt: null,
          updatedAt: null,
          members: [],
          currentUserRole: null
        }
      }, { status: 500 });
    }
  },
};

export default function ProjectMembers({ data }: PageProps<ProjectMembersData>) {
  const { user, project } = data;

  return (
    <DashboardLayout user={user}>
      <div class="p-6">
        <ProjectMembersIsland project={project} currentUser={user} />
      </div>
    </DashboardLayout>
  );
}