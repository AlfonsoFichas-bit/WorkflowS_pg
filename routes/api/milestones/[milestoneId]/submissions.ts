import { Handlers } from "$fresh/server.ts";
import { Status } from "$std/http/status.ts";
import {
  createMilestoneSubmission,
  getMilestoneSubmissionsByMilestoneId,
  getMilestoneSubmissionByMilestoneAndTeam,
} from "../../../../src/db/queries/milestone_submissions.ts";
import { getMilestoneById } from "../../../../src/db/queries/milestones.ts";
import type {
  MilestoneSubmission,
  NewMilestoneSubmission,
} from "../../../../src/db/schema/milestone_submissions.ts";
import type { ApiState } from "../../_middleware.ts";
import {
  hasProjectPermission,
  getUserTeamMembershipInProject,
} from "../../../../src/utils/permissions.ts";
import { PROJECT_OWNER, type ProjectRole } from "../../../../src/types/roles.ts";

export const handler: Handlers<any, ApiState> = {
  // POST /api/milestones/:milestoneId/submissions
  async POST(req, ctx) {
    const state = ctx.state;
    const { sessionUser } = state;

    if (!sessionUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: Status.Unauthorized,
        headers: { "Content-Type": "application/json" },
      });
    }

    const milestoneId = parseInt(ctx.params.milestoneId, 10);
    if (isNaN(milestoneId)) {
      return new Response(JSON.stringify({ error: "Invalid milestone ID" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    let submissionData;
    try {
      submissionData = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { teamId, filePath, notes } = submissionData;

    if (!teamId || typeof teamId !== "number") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid teamId" }),
        {
          status: Status.BadRequest,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    // filePath can be optional or validated further depending on requirements

    try {
      const milestone = await getMilestoneById(milestoneId);
      if (!milestone || !milestone.projectId) {
        return new Response(JSON.stringify({ error: "Milestone not found" }), {
          status: Status.NotFound,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Permission: User must be a member of the provided teamId,
      // and that team must belong to the milestone's project.
      const userTeamMembership = await getUserTeamMembershipInProject(sessionUser.id, milestone.projectId);
      if (!userTeamMembership || userTeamMembership.teamId !== teamId) {
        return new Response(JSON.stringify({ error: "Forbidden: User not a member of the specified team or team not in project." }), {
          status: Status.Forbidden,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Additional check: Milestone status should allow submissions
      if (milestone.status !== "OPEN" && milestone.status !== "PENDING") { // Assuming PENDING also allows first submission
        return new Response(JSON.stringify({ error: `Milestone is not open for submissions. Current status: ${milestone.status}` }), {
          status: Status.Forbidden, // Or BadRequest (400)
          headers: { "Content-Type": "application/json" },
        });
      }

      // Optional: Check if this team has already submitted and if re-submission is allowed.
      // const existingSubmission = await getMilestoneSubmissionByMilestoneAndTeam(milestoneId, teamId);
      // if (existingSubmission) {
      //   return new Response(JSON.stringify({ error: "Team has already submitted for this milestone." }), {
      //     status: Status.Conflict, headers: { "Content-Type": "application/json" },
      //   });
      // }


      const newSubmission: NewMilestoneSubmission = {
        milestoneId,
        teamId,
        filePath: filePath || null, // Handle optional filePath
        notes: notes || null, // Handle optional notes
        // submittedAt is handled by default in schema
      };

      const createdSubmissions = await createMilestoneSubmission(newSubmission);
      if (createdSubmissions.length === 0) {
        return new Response(JSON.stringify({ error: "Failed to create submission" }), {
          status: Status.InternalServerError,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(createdSubmissions[0]), {
        status: Status.Created,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error creating milestone submission:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: Status.InternalServerError,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // GET /api/milestones/:milestoneId/submissions
  async GET(_req, ctx) {
    const state = ctx.state;
    const { sessionUser } = state;

    if (!sessionUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: Status.Unauthorized,
        headers: { "Content-Type": "application/json" },
      });
    }

    const milestoneId = parseInt(ctx.params.milestoneId, 10);
    if (isNaN(milestoneId)) {
      return new Response(JSON.stringify({ error: "Invalid milestone ID" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const milestone = await getMilestoneById(milestoneId);
      if (!milestone || !milestone.projectId) {
        return new Response(JSON.stringify({ error: "Milestone not found" }), {
          status: Status.NotFound,
          headers: { "Content-Type": "application/json" },
        });
      }

      const userProjectMembership = await getUserTeamMembershipInProject(sessionUser.id, milestone.projectId);
      if (!userProjectMembership) {
         return new Response(JSON.stringify({ error: "Forbidden. User not part of this project." }), {
            status: Status.Forbidden,
            headers: { "Content-Type": "application/json" },
        });
      }

      let submissions: MilestoneSubmission[] = [];
      // If user is Project Owner (admin/docente), get all submissions for the milestone
      if (userProjectMembership.role === PROJECT_OWNER) {
        submissions = await getMilestoneSubmissionsByMilestoneId(milestoneId);
      } else if (userProjectMembership.teamId) {
        // If user is part of a team, get only their team's submission
        const teamSubmission = await getMilestoneSubmissionByMilestoneAndTeam(milestoneId, userProjectMembership.teamId);
        if (teamSubmission) {
          submissions = [teamSubmission];
        }
      }
      // If user is a project member but not owner and not in a team (e.g. a role without team association),
      // they might not see any submissions based on this logic. This could be adjusted.

      return new Response(JSON.stringify(submissions), {
        status: Status.OK,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching milestone submissions:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: Status.InternalServerError,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
