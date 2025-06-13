import { Handlers, PageProps, FreshContext } from "$fresh/server.ts";
import { State } from "../../../_middleware.ts";
import { DashboardLayout } from "../../../../../components/DashboardLayout.tsx";
import SprintDetailIsland from "../../../../../islands/SprintDetailIsland.tsx";
import {
  getSprintById,
  getUserStoriesBySprintId,
} from "../../../../../src/db/db.ts";
import { getProjectUserRole } from "../../../../../src/utils/permissions.ts";
import type { ProjectRole } from "../../../../../src/types/roles.ts";
import { userStories } from "../../../../../src/db/schema/index.ts";

// Define types based on the schema tables
type UserStory = typeof userStories.$inferSelect;

// Extended UserStory type that includes sprintName from API
export type UserStoryWithSprintName = UserStory & { sprintName?: string | null };

export interface SprintDetailPageData {
  user: State["user"];
  sprint: any; // Sprint details
  userStories: UserStoryWithSprintName[];
  userRole: ProjectRole | null;
  projectId: number;
}

export const handler: Handlers<SprintDetailPageData, State> = {
  async GET(_req, ctx: FreshContext<State, SprintDetailPageData>) {
    const currentUserId = ctx.state.user.id;
    const projectId = Number.parseInt(ctx.params.id, 10);
    const sprintId = Number.parseInt(ctx.params.sprintId, 10);

    if (Number.isNaN(projectId) || Number.isNaN(sprintId)) {
      return new Response("Invalid project or sprint ID", { status: 400 });
    }

    try {
      // Get sprint details
      const sprintResult = await getSprintById(sprintId);
      if (!sprintResult || sprintResult.length === 0) {
        return new Response("Sprint not found", { status: 404 });
      }
      const sprint = sprintResult[0];

      // Verify that the sprint belongs to the specified project
      if (sprint.projectId !== projectId) {
        return new Response("Sprint does not belong to this project", { status: 404 });
      }

      // Check if user has access to this project
      const userRole = await getProjectUserRole(currentUserId, projectId);
      if (!userRole) {
        return new Response("You don't have access to this project", { status: 403 });
      }

      // Get user stories for this sprint
      const userStoriesResult = await getUserStoriesBySprintId(sprintId);

      return ctx.render({
        user: ctx.state.user,
        sprint,
        userStories: userStoriesResult,
        userRole,
        projectId,
      });
    } catch (error) {
      console.error("Error fetching sprint details:", error);
      return new Response("Error fetching sprint details", { status: 500 });
    }
  },
};

export default function SprintDetailPage({ data }: PageProps<SprintDetailPageData>) {
  const { user, sprint, userStories, userRole, projectId } = data;
  return (
    <DashboardLayout user={user}>
      <div class="p-6">
        <SprintDetailIsland
          user={user}
          sprint={sprint}
          userStories={userStories}
          userRole={userRole}
          projectId={projectId}
        />
      </div>
    </DashboardLayout>
  );
}