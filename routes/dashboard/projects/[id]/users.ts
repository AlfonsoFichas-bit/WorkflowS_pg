import { Handlers } from "$fresh/server.ts";
import { State } from "../../_middleware.ts";
import { createTeamMember, getProjectById, getUserById, getTeamsByProjectId, createTeam, getTeamMembersByTeamId, updateTeamMember } from "../../../../utils/db.ts";

// Manejador para agregar usuarios a un proyecto
export const handler: Handlers<unknown, State> = {
  async POST(req, ctx) {
    try {
      const projectId = parseInt(ctx.params.id);
      const { userId, role } = await req.json();
      
      if (isNaN(projectId)) {
        return new Response(JSON.stringify({ error: "ID de proyecto inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Verificar que el proyecto existe
      const project = await getProjectById(projectId);
      if (!project || project.length === 0) {
        return new Response(JSON.stringify({ error: "Proyecto no encontrado" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Verificar que el usuario existe
      const user = await getUserById(userId);
      if (!user || user.length === 0) {
        return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Agregar el usuario al proyecto (a través de un equipo)
      // Primero, necesitamos obtener o crear un equipo para el proyecto
      const teams = await getTeamsByProjectId(projectId);
      let teamId;
      
      if (teams && teams.length > 0) {
        // Usar el primer equipo existente
        teamId = teams[0].id;
      } else {
        // Crear un nuevo equipo para el proyecto
        const newTeam = await createTeam({
          name: `Equipo de ${project[0].name}`,
          projectId,
        });
        teamId = newTeam[0].id;
      }
      
      // Verificar si el usuario ya está en el equipo
      const teamMembers = await getTeamMembersByTeamId(teamId);
      const existingMember = teamMembers.find(member => member.userId === userId);
      
      let teamMember;
      
      if (existingMember) {
        // Si el usuario ya está en el equipo, actualizar su rol
        teamMember = await updateTeamMember(existingMember.id, {
          role,
        });
      } else {
        // Si el usuario no está en el equipo, agregarlo
        teamMember = await createTeamMember({
          userId,
          teamId,
          role,
        });
      }
      
      return new Response(JSON.stringify({ success: true, teamMember: teamMember[0] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al agregar usuario al proyecto:", error);
      
      return new Response(JSON.stringify({ error: "Error al agregar usuario al proyecto" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
};
