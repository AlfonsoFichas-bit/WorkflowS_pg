import type { MiddlewareHandlerContext } from "$fresh/server.ts";
// Adjusted path assuming utils/auth.ts is at the root of the project's utils directory
import { getSessionData, formatRole } from "../../utils/auth.ts";

// Define the interface for the API state
// This can be identical to dashboard's State if user structure is the same
export interface ApiState {
  user: {
    id: number;
    name: string;
    email: string;
    role: string; // Raw role from DB (e.g., "admin", "team_developer")
    formattedRole: string; // User-friendly role name
  };
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<ApiState>
) {
  // Optionshandler for CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204, // No Content
      headers: {
        "Access-Control-Allow-Origin": "*", // Adjust in production
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const sessionData = getSessionData(req);

  if (!sessionData) {
    // For APIs, instead of redirect, typically return a 401 Unauthorized
    const unauthorizedResponse = new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // CORS header for actual requests
      },
    });
    return unauthorizedResponse;
  }

  ctx.state.user = {
    id: sessionData.id,
    name: sessionData.name,
    email: sessionData.email,
    role: sessionData.role,
    // formattedRole might not be strictly necessary for pure API state logic,
    // but can be included if any API logic might use it or for consistency.
    formattedRole: formatRole(sessionData.role),
  };

  const response = await ctx.next();
  // Add CORS headers to actual API responses as well
  response.headers.set("Access-Control-Allow-Origin", "*"); // Adjust in production
  return response;
}
