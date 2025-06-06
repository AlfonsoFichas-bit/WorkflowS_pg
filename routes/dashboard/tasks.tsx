import { DashboardLayout } from "../../components/DashboardLayout.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import { State } from "./_middleware.ts";

interface TasksData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    formattedRole: string;
  };
}

export const handler: Handlers<TasksData, State> = {
  GET(_req, ctx) {
    // El middleware ya ha verificado la autenticación y ha añadido el usuario al estado
    return ctx.render({
      user: ctx.state.user,
    });
  },
};

export default function Tasks({ data }: PageProps<TasksData>) {
  const { user } = data;
  
  return (
    <DashboardLayout user={user}>
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">Tareas</h1>
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
            Nueva Tarea
          </button>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div class="p-6">
            <p class="text-gray-500 dark:text-gray-400 text-center py-8">No hay tareas disponibles</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}