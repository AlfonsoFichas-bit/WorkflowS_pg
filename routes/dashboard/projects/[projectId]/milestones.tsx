import { Handlers, PageProps } from "$fresh/server.ts";
import { Status } from "$std/http/status.ts";
import { getProjectById, type ProjectWithRelations } from "../../../../src/db/queries/projects.ts";
import { getAllRubrics, type RubricWithRelations } from "../../../../src/db/queries/rubrics.ts";
import { getUserStoriesByProjectId, type UserStory } from "../../../../src/db/queries/user_stories.ts";
import { getMilestonesByProjectId } from "../../../../src/db/queries/milestones.ts";
import type { Milestone } from "../../../../src/db/schema/milestones.ts";
import type { User } from "../../../../src/db/schema/users.ts"; // Assuming User type is from here
import MilestonesManagementIsland from "../../../../islands/MilestonesManagementIsland.tsx";
import { ensureUser } from "../../../../src/utils/auth.ts"; // Assuming auth utilities

interface MilestonesPageData {
  user: User;
  project: ProjectWithRelations;
  milestones: Milestone[];
  allRubrics: RubricWithRelations[];
  projectUserStories: UserStory[];
}

export const handler: Handlers<MilestonesPageData, { user: User }> = {
  async GET(req, ctx) {
    const user = ensureUser(req, ctx); // Ensure user is authenticated
    if (!user) {
      return new Response(null, {
        status: Status.SeeOther,
        headers: { Location: "/auth/login" }, // Redirect to login if not authenticated
      });
    }

    const projectId = parseInt(ctx.params.projectId, 10);
    if (isNaN(projectId)) {
      return ctx.renderNotFound();
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return ctx.renderNotFound();
    }

    // Permission check: User must be the project owner to manage milestones
    if (project.ownerId !== user.id) {
      // Or use a more specific permission check if other roles can view/manage
      // For now, only owner can access this management page.
      return new Response("Unauthorized: You are not the owner of this project.", {
        status: Status.Forbidden,
      });
    }

    const milestones = await getMilestonesByProjectId(projectId);
    const allRubrics = await getAllRubrics(); // Fetches all rubrics for selection
    const projectUserStories = await getUserStoriesByProjectId(projectId);

    return ctx.render({
      user,
      project,
      milestones,
      allRubrics,
      projectUserStories,
    });
  },
};

export default function MilestonesPage({ data }: PageProps<MilestonesPageData>) {
  const { user, project, milestones, allRubrics, projectUserStories } = data;

  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">
        Milestones for: <span class="text-blue-600">{project.name}</span>
      </h1>
      <MilestonesManagementIsland
        project={project}
        initialMilestones={milestones}
        allRubrics={allRubrics}
        projectUserStories={projectUserStories}
        currentUser={user} // Pass current user for any client-side checks if needed
        projectId={project.id} // Pass projectId directly for API calls from island
      />
    </div>
  );
}
