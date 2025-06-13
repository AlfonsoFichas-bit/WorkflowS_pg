import { Handlers, PageProps, FreshContext } from "$fresh/server.ts";
import { State } from "./_middleware.ts";
import { DashboardLayout } from "../../components/DashboardLayout.tsx";
import UserStoriesPageIsland from "../../islands/UserStoriesPageIsland.tsx";
import {
  getAllProjects, // We'll filter these by user's involvement
  getUserStoriesByProjectId,
  // getSprintsByProjectId, // Not used in this iteration
  // getProjectById, // Not strictly needed if getAllProjects gives enough info
} from "../../src/db/db.ts";
import { getProjectUserRole } from "../../src/utils/permissions.ts";
import type { ProjectRole } from "../../src/types/roles.ts";
import { userStories, projects } from "../../src/db/schema/index.ts";

// Define types based on the schema tables
type UserStory = typeof userStories.$inferSelect;
type Project = typeof projects.$inferSelect;

// Interface for project data passed to the island, including the user's role in it
export interface ProjectWithUserRole extends Project {
  userRole: ProjectRole | null;
}

export interface UserStoriesPageData {
  user: State["user"];
  projects: ProjectWithUserRole[]; // Projects the user is part of, with their role
  initialStories: UserStory[]; // Renamed from initialUserStories
  selectedProjectId: number | null;
}

export const handler: Handlers<UserStoriesPageData, State> = {
  async GET(req, ctx: FreshContext<State, UserStoriesPageData>) {
    // Access user directly from ctx.state
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
      if (!Number.isNaN(parsedId) && projectsForUser.some(p => 'id' in p && p.id === parsedId)) {
        selectedProjectId = parsedId;
      }
    } else if (projectsForUser.length > 0) {
      // Default to the first project in the user's list
      const firstProject = projectsForUser[0];
      if ('id' in firstProject) {
        selectedProjectId = firstProject.id;
      }
    }

    let initialUserStories: UserStory[] = [];
    if (selectedProjectId !== null) {
      // At this point, selectedProjectId is confirmed to be one the user has a role in.
      // The API for fetching user stories will also perform its own checks if called from client.
      // Direct DB call here assumes server has necessary access rights.
      initialUserStories = await getUserStoriesByProjectId(selectedProjectId);
    }

    return ctx.render({
      user: ctx.state.user,
      projects: projectsForUser,
      initialStories: initialUserStories, // Renamed in render call
      selectedProjectId,
    });
  },
};

export default function UserStoriesPage({ data }: PageProps<UserStoriesPageData>) {
  const { user, projects, initialStories, selectedProjectId } = data; // Destructure renamed prop
  return (
    <DashboardLayout user={user}>
      <div class="p-6">
        <UserStoriesPageIsland
          user={user}
          projects={projects} // These are now projects user is part of, with roles
          initialStories={initialStories} // Pass renamed prop
          selectedProjectId={selectedProjectId}
        />
      </div>
    </DashboardLayout>
  );
}