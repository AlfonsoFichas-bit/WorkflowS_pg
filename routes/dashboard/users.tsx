import { DashboardLayout } from "../../components/DashboardLayout.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import { State } from "./_middleware.ts";
import { createUser, getAllUsersWithTeamMemberships, deleteUser, deleteTeamMembersByUserId } from "../../utils/db.ts";
import UsersPageIsland from "../../islands/UsersPageIsland.tsx";

interface TeamMembership {
  id: number;
  userId: number;
  teamId: number;
  role: string;
  team: {
    id: number;
    name: string;
    projectId: number;
  } | null;
  project: {
    id: number;
    name: string;
    description: string | null;
  } | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  paternalLastName: string | null;
  maternalLastName: string | null;
  password: string;
  teamMemberships?: TeamMembership[];
}

interface UsersData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    formattedRole: string;
  };
  usersList: User[];
}

export const handler: Handlers<UsersData, State> = {
  async GET(_req, ctx) {
    // El middleware ya ha verificado la autenticación y ha añadido el usuario al estado

    // Obtener la lista de usuarios con sus membresías de equipo
    const usersList = await getAllUsersWithTeamMemberships();

    return ctx.render({
      user: ctx.state.user,
      usersList,
    });
  },

  async POST(req, ctx) {
    // Verificar que el usuario actual es administrador
    if (ctx.state.user.role !== "admin") {
      return new Response(JSON.stringify({ error: "No tienes permisos para crear usuarios" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const formData = await req.json();
      const { name, email, password, role, paternalLastName, maternalLastName } = formData;

      // Crear el usuario utilizando la función del servicio
      await createUser({
        name,
        email,
        password,
        role,
        paternalLastName: paternalLastName || "", // Usar el valor proporcionado o cadena vacía
        maternalLastName: maternalLastName || "", // Usar el valor proporcionado o cadena vacía
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al crear usuario:", error);

      // Si el error es que el usuario ya existe, devolver un mensaje específico
      if (error instanceof Error && error.message === "User with this email already exists") {
        return new Response(JSON.stringify({ error: "El correo electrónico ya está registrado" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Error al crear el usuario" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
};

// Manejador para la ruta de usuario específico (para eliminar)
export const userHandler: Handlers<unknown, State> = {
  async DELETE(req, ctx) {
    // Verificar que el usuario actual es administrador
    if (ctx.state.user.role !== "admin") {
      return new Response(JSON.stringify({ error: "No tienes permisos para eliminar usuarios" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Obtener el ID del usuario de los parámetros de la URL
      const userId = parseInt(ctx.params.id);

      if (isNaN(userId)) {
        return new Response(JSON.stringify({ error: "ID de usuario inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Evitar que un administrador se elimine a sí mismo
      if (userId === ctx.state.user.id) {
        return new Response(JSON.stringify({ error: "No puedes eliminar tu propia cuenta" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Primero, eliminar todas las referencias al usuario en la tabla team_members
      await deleteTeamMembersByUserId(userId);

      // Luego, eliminar el usuario
      const deletedUser = await deleteUser(userId);

      if (!deletedUser || deletedUser.length === 0) {
        return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);

      // Proporcionar un mensaje de error más específico
      let errorMessage = "Error al eliminar el usuario";

      if (error instanceof Error) {
        if (error.message.includes("llave foránea") || error.message.includes("foreign key")) {
          errorMessage = "No se puede eliminar el usuario porque está asignado a uno o más proyectos. Elimine primero las asignaciones del usuario.";
        } else {
          errorMessage = error.message;
        }
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
};

export default function Users({ data }: PageProps<UsersData>) {
  const { user, usersList } = data;

  return (
    <DashboardLayout user={user}>
      <div class="p-6">
        <UsersPageIsland user={user} usersList={usersList} />
      </div>
    </DashboardLayout>
  );
}
