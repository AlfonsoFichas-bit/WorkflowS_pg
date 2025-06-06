import { Handlers } from "$fresh/server.ts";
import { State } from "../_middleware.ts";
import { getAllUsers } from "../../../utils/db.ts";

// Manejador para obtener usuarios disponibles para agregar a proyectos
export const handler: Handlers<unknown, State> = {
  async GET(req, ctx) {
    try {
      // Obtener todos los usuarios
      const allUsers = await getAllUsers();
      // Filtrar el usuario actual si existe
      const currentUser = ctx.state.user as { id: number } | undefined;
      const users = currentUser ? allUsers.filter(user => user.id !== currentUser.id) : allUsers;
      
      return new Response(JSON.stringify({ users }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      
      return new Response(JSON.stringify({ error: "Error al obtener usuarios" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
};
