import { DashboardLayout } from "../../components/DashboardLayout.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";

interface DashboardData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    formattedRole: string;
  };
}

export const handler: Handlers<DashboardData> = {
  GET(_req, ctx) {
    // El middleware ya ha verificado la autenticación y ha añadido el usuario al estado
    return ctx.render({
      user: ctx.state.user,
    });
  },
};

export default function Dashboard({ data }: PageProps<DashboardData>) {
  const { user } = data;
  
  return (
    <DashboardLayout user={user}>
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">Dashboard</h1>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">Bienvenido al panel de control, {user.name}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 class="text-lg font-semibold mb-2">Proyectos</h2>
            <p class="text-3xl font-bold">0</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Proyectos activos</p>
          </div>
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 class="text-lg font-semibold mb-2">Tareas</h2>
            <p class="text-3xl font-bold">0</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Tareas pendientes</p>
          </div>
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 class="text-lg font-semibold mb-2">Equipo</h2>
            <p class="text-3xl font-bold">0</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Miembros del equipo</p>
          </div>
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 class="text-lg font-semibold mb-2">Usuarios</h2>
            <p class="text-3xl font-bold">0</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Usuarios registrados</p>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 class="text-lg font-semibold mb-4">Actividad Reciente</h2>
          <div class="space-y-4">
            <p class="text-gray-500 dark:text-gray-400 text-center py-8">No hay actividad reciente</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}