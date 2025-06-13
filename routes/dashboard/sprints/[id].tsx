import { Handlers, PageProps, FreshContext } from "$fresh/server.ts";
import { State } from "../_middleware.ts";
import { DashboardLayout } from "../../../components/DashboardLayout.tsx";
import SprintDetailIsland from "../../../islands/SprintDetailIsland.tsx";
import {
  getSprintById,
  getUserStoriesBySprintId,
} from "../../../src/db/db.ts";
import { getProjectUserRole } from "../../../src/utils/permissions.ts";
import type { ProjectRole } from "../../../src/types/roles.ts";
import { userStories } from "../../../src/db/schema/index.ts";

// Define types based on the schema tables
type UserStory = typeof userStories.$inferSelect;

// Extended UserStory type that includes sprintName from API
export type UserStoryWithSprintName = UserStory & { sprintName?: string | null };

export interface SprintDetailPageData {
  user: State["user"];
  sprint: any; // Sprint details
  userStories: UserStoryWithSprintName[];
  userRole: ProjectRole | null;
}

export const handler: Handlers<SprintDetailPageData, State> = {
  async GET(_req, ctx: FreshContext<State, SprintDetailPageData>) {
    const currentUserId = ctx.state.user.id;
    const sprintId = Number.parseInt(ctx.params.id, 10);

    if (Number.isNaN(sprintId)) {
      return new Response("Invalid sprint ID", { status: 400 });
    }

    try {
      // Get sprint details
      const sprintResult = await getSprintById(sprintId);
      if (!sprintResult || sprintResult.length === 0) {
        return new Response("Sprint not found", { status: 404 });
      }
      const sprint = sprintResult[0];
      const projectId = sprint.projectId;

      // Check if user has access to this sprint's project
      const userRole = await getProjectUserRole(currentUserId, projectId);
      if (!userRole) {
        return new Response("You don't have access to this sprint", { status: 403 });
      }

      // Redirect to the new URL structure
      return new Response("", {
        status: 302,
        headers: {
          Location: `/dashboard/projects/${projectId}/sprints/${sprintId}`
        }
      });
    } catch (error) {
      console.error("Error fetching sprint details:", error);
      return new Response("Error fetching sprint details", { status: 500 });
    }
  },
};

export default function SprintDetailPage({ data }: PageProps<SprintDetailPageData>) {
  const { user, sprint, userStories, userRole } = data;
  return (
    <DashboardLayout user={user}>
      <div class="p-6">
        <SprintDetailIsland
          user={user}
          sprint={sprint}
          userStories={userStories}
          userRole={userRole}
          projectId={sprint.projectId}
        />
      </div>
    </DashboardLayout>
  );
}