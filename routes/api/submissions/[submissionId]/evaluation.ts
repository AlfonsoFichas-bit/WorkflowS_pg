import { Handlers } from "$fresh/server.ts";
import { Status } from "$std/http/status.ts";
import {
  createMilestoneEvaluation,
  getMilestoneEvaluationBySubmissionId,
} from "../../../../src/db/queries/milestone_evaluations.ts";
import { getMilestoneSubmissionWithProjectInfoById } from "../../../../src/db/queries/milestone_submissions.ts";
import { getUserTeamMembershipInProject, hasProjectPermission } from "../../../../src/utils/permissions.ts";
import type { ApiState } from "../../_middleware.ts";
import type {
  NewMilestoneEvaluation,
  NewMilestoneEvaluationCriterionScore,
  MilestoneEvaluationWithCriteria,
} from "../../../../src/db/queries/milestone_evaluations.ts"; // Import types from queries
import { PROJECT_OWNER } from "../../../../src/types/roles.ts";

export const handler: Handlers<any, ApiState> = {
  // POST /api/submissions/:submissionId/evaluation
  async POST(req, ctx) {
    const state = ctx.state;
    const { sessionUser } = state;

    if (!sessionUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: Status.Unauthorized,
        headers: { "Content-Type": "application/json" },
      });
    }

    const submissionId = parseInt(ctx.params.submissionId, 10);
    if (isNaN(submissionId)) {
      return new Response(JSON.stringify({ error: "Invalid submission ID" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    let evalData;
    try {
      evalData = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { overallScore, generalFeedback, criteriaScores } = evalData;

    try {
      const submissionDetails = await getMilestoneSubmissionWithProjectInfoById(submissionId);
      if (!submissionDetails) {
        return new Response(JSON.stringify({ error: "Submission not found" }), {
          status: Status.NotFound,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Permission: User must be Project Owner for the project
      const isProjectOwner = await hasProjectPermission(sessionUser.id, submissionDetails.projectId, [PROJECT_OWNER]);
      if (!isProjectOwner) {
        return new Response(JSON.stringify({ error: "Forbidden: User is not authorized to evaluate this submission." }), {
          status: Status.Forbidden,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if evaluation already exists for this submission
      const existingEvaluation = await getMilestoneEvaluationBySubmissionId(submissionId);
      if (existingEvaluation) {
        return new Response(JSON.stringify({ error: "Evaluation already exists for this submission. Use PUT to update." }), {
          status: Status.Conflict,
          headers: { "Content-Type": "application/json" },
        });
      }

      const newEvaluationData: NewMilestoneEvaluation = {
        milestoneSubmissionId: submissionId,
        evaluatorId: sessionUser.id, // Evaluator is the logged-in user
        overallScore: overallScore, // Can be null
        generalFeedback: generalFeedback, // Can be null
        // evaluationTimestamp is handled by default in schema
      };

      // Validate criteriaScores structure if provided
      if (criteriaScores && !Array.isArray(criteriaScores)) {
        return new Response(JSON.stringify({ error: "criteriaScores must be an array" }), {
            status: Status.BadRequest, headers: { "Content-Type": "application/json" },
        });
      }
      if (criteriaScores) {
        for (const cs of criteriaScores) {
            if (cs.rubricCriteriaId == null || cs.score == null) {
                 return new Response(JSON.stringify({ error: "Each criterion score must have rubricCriteriaId and score" }), {
                    status: Status.BadRequest, headers: { "Content-Type": "application/json" },
                });
            }
        }
      }


      const createdEvaluationResult = await createMilestoneEvaluation(
        newEvaluationData,
        criteriaScores as NewMilestoneEvaluationCriterionScore[] // Cast needed if structure is validated
      );

      if (createdEvaluationResult.length === 0) {
         return new Response(JSON.stringify({ error: "Failed to create evaluation" }), {
            status: Status.InternalServerError, headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(createdEvaluationResult[0]), {
        status: Status.Created,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error creating milestone evaluation:", error);
      // Check for specific Drizzle/DB errors if possible (e.g., unique constraint violation)
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: Status.InternalServerError,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // GET /api/submissions/:submissionId/evaluation
  async GET(_req, ctx) {
    const state = ctx.state;
    const { sessionUser } = state;

    if (!sessionUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: Status.Unauthorized,
        headers: { "Content-Type": "application/json" },
      });
    }

    const submissionId = parseInt(ctx.params.submissionId, 10);
    if (isNaN(submissionId)) {
      return new Response(JSON.stringify({ error: "Invalid submission ID" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const submissionDetails = await getMilestoneSubmissionWithProjectInfoById(submissionId);
      if (!submissionDetails) {
        return new Response(JSON.stringify({ error: "Submission not found" }), {
          status: Status.NotFound,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Permission: User must be Project Owner OR a member of the team that made the submission.
      const isProjectOwner = await hasProjectPermission(sessionUser.id, submissionDetails.projectId, [PROJECT_OWNER]);
      let isTeamMember = false;
      if (!isProjectOwner) {
        const teamMembership = await getUserTeamMembershipInProject(sessionUser.id, submissionDetails.projectId);
        if (teamMembership && teamMembership.teamId === submissionDetails.teamId) {
          isTeamMember = true;
        }
      }

      if (!isProjectOwner && !isTeamMember) {
        return new Response(JSON.stringify({ error: "Forbidden: User is not authorized to view this evaluation." }), {
          status: Status.Forbidden,
          headers: { "Content-Type": "application/json" },
        });
      }

      const evaluation = await getMilestoneEvaluationBySubmissionId(submissionId);
      if (!evaluation) {
        return new Response(JSON.stringify({ error: "Evaluation not found for this submission" }), {
          status: Status.NotFound,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(evaluation), {
        status: Status.OK,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching milestone evaluation:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: Status.InternalServerError,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
