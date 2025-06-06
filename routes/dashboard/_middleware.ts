import type { MiddlewareHandlerContext } from "$fresh/server.ts";
import { getSessionData, redirect, formatRole } from "../../utils/auth.ts";

// Definir la interfaz para el estado
export interface State {
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
  ctx: MiddlewareHandlerContext<State>
) {
  // Obtener los datos de la sesión
  const sessionData = getSessionData(req);

  // Si no hay sesión, redirigir al login
  if (!sessionData) {
    return redirect("/auth/login");
  }

  // Añadir el usuario al estado
  ctx.state.user = {
    id: sessionData.id,
    name: sessionData.name,
    email: sessionData.email,
    role: sessionData.role,
    formattedRole: formatRole(sessionData.role),
  };

  return await ctx.next();
}
