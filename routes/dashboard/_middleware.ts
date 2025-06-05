import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { getSessionData, requireAuth, formatRole } from "../../utils/auth.ts";

interface DashboardState {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    formattedRole: string;
  };
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<DashboardState>
) {
  // Verificar si el usuario está autenticado
  const authRedirect = requireAuth(req);
  if (authRedirect) {
    return authRedirect;
  }

  // Obtener los datos del usuario de la sesión
  const sessionData = getSessionData(req);
  
  // Añadir los datos del usuario al estado
  ctx.state.user = {
    ...sessionData,
    formattedRole: formatRole(sessionData.role)
  };
  
  return await ctx.next();
}