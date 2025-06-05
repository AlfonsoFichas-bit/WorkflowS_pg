import { DashboardLayout } from "../../components/DashboardLayout.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";

interface TeamData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    formattedRole: string;
  };
}

export const handler: Handlers<TeamData> = {
  GET(_req, ctx) {
    // El middleware ya ha verificado la autenticación y ha añadido el usuario al estado
    return ctx.render({
      user: ctx.state.user,
    });
  },
};

export default function Team({ data }: PageProps<TeamData>) {
  const { user } = data;
  
  return (
    <DashboardLayout user={user}>
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">Equipo</h1>
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
            Añadir Miembro
          </button>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div class="p-6">
            <p class="text-gray-500 dark:text-gray-400 text-center py-8">No hay miembros en el equipo</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}