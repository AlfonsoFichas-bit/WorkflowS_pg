import { Handlers } from "$fresh/server.ts";
import { Status } from "$std/http/status.ts";
import {
  getMilestoneEvaluationById,
  updateMilestoneEvaluation,
  deleteMilestoneEvaluation,
  type NewMilestoneEvaluationCriterionScore, // For casting in update
} from "../../../src/db/queries/milestone_evaluations.ts"; // Adjusted path
import { getMilestoneSubmissionWithProjectInfoById } from "../../../src/db/queries/milestone_submissions.ts";
import type { ApiState } from "../_middleware.ts"; // Adjusted path
import { hasProjectPermission } from "../../../src/utils/permissions.ts"; // Adjusted path
import { PROJECT_OWNER } from "../../../src/types/roles.ts"; // Adjusted path

export const handler: Handlers<any, ApiState> = {
  // PUT /api/evaluations/:evaluationId
  async PUT(req, ctx) {
    const state = ctx.state;
    const { sessionUser } = state;

    if (!sessionUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: Status.Unauthorized,
        headers: { "Content-Type": "application/json" },
      });
    }

    const evaluationId = parseInt(ctx.params.evaluationId, 10);
    if (isNaN(evaluationId)) {
      return new Response(JSON.stringify({ error: "Invalid evaluation ID" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    let updatePayload;
    try {
      updatePayload = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { overallScore, generalFeedback, criteriaScores } = updatePayload;

    try {
      const existingEvaluation = await getMilestoneEvaluationById(evaluationId);
      if (!existingEvaluation) {
        return new Response(JSON.stringify({ error: "Evaluation not found" }), {
          status: Status.NotFound,
          headers: { "Content-Type": "application/json" },
        });
      }

      const submissionDetails = await getMilestoneSubmissionWithProjectInfoById(existingEvaluation.milestoneSubmissionId);
      if (!submissionDetails) {
        // Should not happen if evaluation exists and DB is consistent
        return new Response(JSON.stringify({ error: "Associated submission not found" }), {
          status: Status.InternalServerError,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Permissions: User must be the original evaluator OR a Project Owner of the project.
      const isOriginalEvaluator = existingEvaluation.evaluatorId === sessionUser.id;
      const isProjectOwner = await hasProjectPermission(sessionUser.id, submissionDetails.projectId, [PROJECT_OWNER]);

      if (!isOriginalEvaluator && !isProjectOwner) {
        return new Response(JSON.stringify({ error: "Forbidden: User is not authorized to update this evaluation." }), {
          status: Status.Forbidden,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Prepare main evaluation data, excluding fields not allowed to be updated here (like evaluatorId)
      const evaluationUpdateData: Partial<typeof existingEvaluation> = {};
      if (overallScore !== undefined) evaluationUpdateData.overallScore = overallScore;
      if (generalFeedback !== undefined) evaluationUpdateData.generalFeedback = generalFeedback;
      // evaluationTimestamp will be updated by `onUpdateNow()` if schema has it, or manually if needed.
      // For now, assuming db query for update handles it or it's not auto-updated.

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


      const updatedEvaluationResult = await updateMilestoneEvaluation(
        evaluationId,
        evaluationUpdateData,
        criteriaScores as Partial<NewMilestoneEvaluationCriterionScore>[] // Cast if needed
      );

      if (updatedEvaluationResult.length === 0) {
         return new Response(JSON.stringify({ error: "Failed to update evaluation or evaluation not found" }), {
            status: Status.NotFound, headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(updatedEvaluationResult[0]), {
        status: Status.OK,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error updating milestone evaluation:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: Status.InternalServerError,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // DELETE /api/evaluations/:evaluationId
  async DELETE(_req, ctx) {
    const state = ctx.state;
    const { sessionUser } = state;

    if (!sessionUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: Status.Unauthorized,
        headers: { "Content-Type": "application/json" },
      });
    }

    const evaluationId = parseInt(ctx.params.evaluationId, 10);
    if (isNaN(evaluationId)) {
      return new Response(JSON.stringify({ error: "Invalid evaluation ID" }), {
        status: Status.BadRequest,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const existingEvaluation = await getMilestoneEvaluationById(evaluationId);
      if (!existingEvaluation) {
        return new Response(JSON.stringify({ error: "Evaluation not found" }), {
          status: Status.NotFound,
          headers: { "Content-Type": "application/json" },
        });
      }

      const submissionDetails = await getMilestoneSubmissionWithProjectInfoById(existingEvaluation.milestoneSubmissionId);
      if (!submissionDetails) {
         return new Response(JSON.stringify({ error: "Associated submission not found" }), {
          status: Status.InternalServerError, headers: { "Content-Type": "application/json" },
        });
      }

      // Permissions: User must be the original evaluator OR a Project Owner.
      const isOriginalEvaluator = existingEvaluation.evaluatorId === sessionUser.id;
      const isProjectOwner = await hasProjectPermission(sessionUser.id, submissionDetails.projectId, [PROJECT_OWNER]);

      if (!isOriginalEvaluator && !isProjectOwner) {
        return new Response(JSON.stringify({ error: "Forbidden: User is not authorized to delete this evaluation." }), {
          status: Status.Forbidden,
          headers: { "Content-Type": "application/json" },
        });
      }

      const deleteResult = await deleteMilestoneEvaluation(evaluationId);
      if (deleteResult.rowCount === 0) {
         return new Response(JSON.stringify({ error: "Evaluation not found or already deleted" }), {
            status: Status.NotFound, headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "Evaluation deleted successfully" }), {
        status: Status.OK, // Or 204 No Content
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error deleting milestone evaluation:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: Status.InternalServerError,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
