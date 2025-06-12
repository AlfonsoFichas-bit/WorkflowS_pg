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
import { getProjectUserRole } from "../../utils/permissions.ts";
import type { ProjectRole } from "../../types/roles.ts";
import type { UserStory } from "../../src/db/schema/index.ts"; // Assuming UserStory type from schema
import type { Project } from "../../src/db/schema/index.ts"; // Assuming Project type from schema

// Interface for project data passed to the island, including the user's role in it
export interface ProjectWithUserRole extends Project {
  userRole: ProjectRole | null;
}

export interface UserStoriesPageData {
  user: State["user"];
  projects: ProjectWithUserRole[]; // Projects the user is part of, with their role
  initialUserStories: UserStory[];
  selectedProjectId: number | null;
}

export const handler: Handlers<UserStoriesPageData, State> = {
  async GET(req, ctx: FreshContext<State, UserStoriesPageData>) {
    const { state }_ = ctx; // Underscore if ctx.state.user is not directly used here, but currentUserId is
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
      // Ensure the queried projectId is one the user has access to
      if (!isNaN(parsedId) && projectsForUser.some(p => p.id === parsedId)) {
        selectedProjectId = parsedId;
      }
    } else if (projectsForUser.length > 0) {
      // Default to the first project in the user's list
      selectedProjectId = projectsForUser[0].id;
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
      initialUserStories,
      selectedProjectId,
    });
  },
};

export default function UserStoriesPage({ data }: PageProps<UserStoriesPageData>) {
  const { user, projects, initialUserStories, selectedProjectId } = data;
  return (
    <DashboardLayout user={user}>
      <div class="p-6">
        <UserStoriesPageIsland
          user={user}
          projects={projects} // These are now projects user is part of, with roles
          initialUserStories={initialUserStories}
          selectedProjectId={selectedProjectId}
        />
      </div>
    </DashboardLayout>
  );
}