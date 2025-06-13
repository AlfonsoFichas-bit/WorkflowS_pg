import { Handlers, PageProps, FreshContext } from "$fresh/server.ts";
import { State } from "../../../_middleware.ts";
import { DashboardLayout } from "../../../../../components/DashboardLayout.tsx";
import SprintPlanningIsland from "../../../../../islands/SprintPlanningIsland.tsx";
import {
  getAllProjects,
  getProjectById,
} from "../../../../../src/db/db.ts";
import { getProjectUserRole } from "../../../../../src/utils/permissions.ts";
import type { ProjectRole } from "../../../../../src/types/roles.ts";

// Interface for project data passed to the island, including the user's role in it
export interface ProjectWithUserRole {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  userRole: ProjectRole | null;
}

export interface SprintPlanningPageData {
  user: State["user"];
  project: ProjectWithUserRole;
  projectId: number;
}

export const handler: Handlers<SprintPlanningPageData, State> = {
  async GET(_req, ctx: FreshContext<State, SprintPlanningPageData>) {
    const currentUserId = ctx.state.user.id;
    const projectId = Number.parseInt(ctx.params.id, 10);

    if (Number.isNaN(projectId)) {
      return new Response("Invalid project ID", { status: 400 });
    }

    try {
      // Get project details
      const projectResult = await getProjectById(projectId);
      if (!projectResult || projectResult.length === 0) {
        return new Response("Project not found", { status: 404 });
      }
      const dbProject = projectResult[0];

      // Check if user has access to this project
      const userRole = await getProjectUserRole(currentUserId, projectId);
      if (!userRole) {
        return new Response("You don't have access to this project", { status: 403 });
      }

      const project: ProjectWithUserRole = {
        ...dbProject,
        userRole,
      };

      return ctx.render({
        user: ctx.state.user,
        project,
        projectId,
      });
    } catch (error) {
      console.error("Error fetching project details:", error);
      return new Response("Error fetching project details", { status: 500 });
    }
  },
};

export default function SprintPlanningPage({ data }: PageProps<SprintPlanningPageData>) {
  const { user, project, projectId } = data;
  return (
    <DashboardLayout user={user}>
      <div class="p-6">
        <SprintPlanningIsland
          user={user}
          project={project}
          projectId={projectId}
        />
      </div>
    </DashboardLayout>
  );
}