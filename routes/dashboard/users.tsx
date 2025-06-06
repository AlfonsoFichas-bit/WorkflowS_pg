import { DashboardLayout } from "../../components/DashboardLayout.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import { createUser, getAllUsers, deleteUser } from "../../utils/db.ts";
import UsersPageIsland from "../../islands/UsersPageIsland.tsx";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
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

export const handler: Handlers<UsersData> = {
  async GET(_req, ctx) {
    // El middleware ya ha verificado la autenticación y ha añadido el usuario al estado
    
    // Obtener la lista de usuarios utilizando la función del servicio
    const usersList = await getAllUsers();
    
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
      const { name, email, password, role, paternal_last_name, maternal_last_name } = formData;
      
      // Crear el usuario utilizando la función del servicio
      await createUser({
        name,
        email,
        password,
        role,
        paternal_last_name: paternal_last_name || "", // Usar el valor proporcionado o cadena vacía
        maternal_last_name: maternal_last_name || "", // Usar el valor proporcionado o cadena vacía
      });
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error al crear usuario:", error);
      
      // Si el error es que el usuario ya existe, devolver un mensaje específico
      if (error.message === "User with this email already exists") {
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
export const userHandler: Handlers = {
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
      
      // Eliminar el usuario utilizando la función del servicio
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
      
      return new Response(JSON.stringify({ error: "Error al eliminar el usuario" }), {
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