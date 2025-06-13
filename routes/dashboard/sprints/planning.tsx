import { Handlers, PageProps, FreshContext } from "$fresh/server.ts";
import { State } from "../_middleware.ts";

export const handler: Handlers<unknown, State> = {
  async GET(req, _ctx: FreshContext<State>) {
    const url = new URL(req.url);
    const queryProjectId = url.searchParams.get("projectId");
    
    if (!queryProjectId) {
      // If no project ID is specified, redirect to projects page
      return new Response("", {
        status: 302,
        headers: {
          Location: `/dashboard/projects`
        }
      });
    }
    
    const parsedProjectId = Number.parseInt(queryProjectId, 10);
    if (Number.isNaN(parsedProjectId)) {
      return new Response("Invalid project ID", { status: 400 });
    }
    
    // Redirect to the new URL structure
    return new Response("", {
      status: 302,
      headers: {
        Location: `/dashboard/projects/${parsedProjectId}/sprints/planning`
      }
    });
  },
};