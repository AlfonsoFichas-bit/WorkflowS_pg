import { Handlers, PageProps, FreshContext } from "$fresh/server.ts";
import { State } from "./_middleware.ts";
import { DashboardLayout } from "../../components/DashboardLayout.tsx";
import KanbanBoardIsland from "../../islands/KanbanBoardIsland.tsx";
import {
  getAllProjects,
  getUserStoriesByProjectId,
} from "../../src/db/db.ts";
import { getProjectUserRole } from "../../src/utils/permissions.ts";
import type { ProjectRole } from "../../src/types/roles.ts";
import { userStories } from "../../src/db/schema/index.ts";

// Define types based on the schema tables
type UserStory = typeof userStories.$inferSelect;

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

// Extended UserStory type that includes sprintName from API
export type UserStoryWithSprintName = UserStory & { sprintName?: string | null };

export interface KanbanBoardPageData {
  user: State["user"];
  projects: ProjectWithUserRole[];
  initialStories: UserStoryWithSprintName[];
  selectedProjectId: number | null;
}

export const handler: Handlers<KanbanBoardPageData, State> = {
  async GET(req, ctx: FreshContext<State, KanbanBoardPageData>) {
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
      const parsedId = Number.parseInt(queryProjectId, 10);
      // Ensure the queried projectId is one the user has access to
      if (!Number.isNaN(parsedId) && projectsForUser.some(p => p.id === parsedId)) {
        selectedProjectId = parsedId;
      }
    } else if (projectsForUser.length > 0) {
      // Default to the first project in the user's list
      selectedProjectId = projectsForUser[0].id;
    }

    let initialUserStories: UserStoryWithSprintName[] = [];
    if (selectedProjectId !== null) {
      initialUserStories = await getUserStoriesByProjectId(selectedProjectId);
    }

    return ctx.render({
      user: ctx.state.user,
      projects: projectsForUser,
      initialStories: initialUserStories,
      selectedProjectId,
    });
  },
};

export default function KanbanBoardPage({ data }: PageProps<KanbanBoardPageData>) {
  const { user, projects, initialStories, selectedProjectId } = data;
  return (
    <DashboardLayout user={user}>
      <div class="p-6">
        <KanbanBoardIsland
          user={user}
          projects={projects}
          initialStories={initialStories}
          selectedProjectId={selectedProjectId}
        />
      </div>
    </DashboardLayout>
  );
}