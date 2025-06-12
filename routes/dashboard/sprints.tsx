import { Handlers, PageProps, FreshContext } from "$fresh/server.ts";
import { State } from "./_middleware.ts";
import { DashboardLayout } from "../../components/DashboardLayout.tsx";
import SprintsPageIsland from "../../islands/SprintsPageIsland.tsx";
import {
  getAllProjects, // To be filtered by user's involvement
  getSprintsByProjectId,
} from "../../src/db/db.ts";
import { getProjectUserRole } from "../../utils/permissions.ts";
import type { ProjectRole } from "../../types/roles.ts";
import type { Sprint, Project } from "../../src/db/schema/index.ts";

// Interface for project data passed to the island, including the user's role in it
export interface ProjectWithUserRole extends Project {
  userRole: ProjectRole | null;
}

export interface SprintsPageData {
  user: State["user"];
  projects: ProjectWithUserRole[]; // Projects the user is part of, with their role
  initialSprints: Sprint[];
  selectedProjectId: number | null;
}

export const handler: Handlers<SprintsPageData, State> = {
  async GET(req, ctx: FreshContext<State, SprintsPageData>) {
    const currentUserId = ctx.state.user.id;
    const url = new URL(req.url);
    const queryProjectId = url.searchParams.get("projectId");

    let selectedProjectId: number | null = null;

    const allDbProjects = await getAllProjects();
    const projectsForUser: ProjectWithUserRole[] = [];

    for (const dbProject of allDbProjects) {
      const userRole = await getProjectUserRole(currentUserId, dbProject.id);
      if (userRole) { // Only include projects where the user has a role
        projectsForUser.push({
          ...dbProject,
          userRole,
        });
      }
    }

    if (queryProjectId) {
      const parsedId = parseInt(queryProjectId, 10);
      if (!isNaN(parsedId) && projectsForUser.some(p => p.id === parsedId)) {
        selectedProjectId = parsedId;
      }
    } else if (projectsForUser.length > 0) {
      selectedProjectId = projectsForUser[0].id;
    }

    let initialSprints: Sprint[] = [];
    if (selectedProjectId !== null) {
      initialSprints = await getSprintsByProjectId(selectedProjectId);
    }

    return ctx.render({
      user: ctx.state.user,
      projects: projectsForUser,
      initialSprints,
      selectedProjectId,
    });
  },
};

export default function SprintsPage({ data }: PageProps<SprintsPageData>) {
  const { user, projects, initialSprints, selectedProjectId } = data;
  return (
    <DashboardLayout user={user}>
      <div class="p-6">
        <SprintsPageIsland
          user={user}
          projects={projects}
          initialSprints={initialSprints}
          selectedProjectId={selectedProjectId}
        />
      </div>
    </DashboardLayout>
  );
}
