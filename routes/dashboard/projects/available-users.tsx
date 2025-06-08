import { Handlers } from "$fresh/server.ts";
import { State } from "../_middleware.ts";
import { getAllUsers, getProjectMembers } from "../../../utils/db.ts";

export const handler: Handlers<unknown, State> = {
  async GET(req, ctx) {
    try {
      // Obtener el ID del proyecto de la URL si existe
      const url = new URL(req.url);
      const projectId = url.searchParams.get("projectId");

      // Obtener todos los usuarios
      const allUsers = await getAllUsers();

      // Filtrar el usuario actual si existe
      const currentUser = ctx.state.user as { id: number } | undefined;
      let users = currentUser ? allUsers.filter(user => user.id !== currentUser.id) : allUsers;

      // Si se proporciona un ID de proyecto, filtrar los usuarios que ya son miembros
      if (projectId) {
        const projectIdNum = parseInt(projectId);
        if (!isNaN(projectIdNum)) {
          // Obtener los miembros actuales del proyecto
          const projectMembers = await getProjectMembers(projectIdNum);

          // Obtener los IDs de los usuarios que ya son miembros
          const memberUserIds = projectMembers.map(member => member.userId);

          // Filtrar los usuarios que ya son miembros
          users = users.filter(user => !memberUserIds.includes(user.id));
        }
      }

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
