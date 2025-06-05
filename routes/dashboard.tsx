import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { getSessionData, requireAuth } from "../utils/auth.ts";

interface DashboardData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export const handler: Handlers<DashboardData> = {
  GET(req, ctx) {
    // Verificar si el usuario está autenticado
    const authRedirect = requireAuth(req);
    if (authRedirect) {
      return authRedirect;
    }

    // Obtener los datos del usuario de la sesión
    const sessionData = getSessionData(req);
    
    return ctx.render({
      user: sessionData,
    });
  },
};

export default function Dashboard({ data }: PageProps<DashboardData>) {
  const { user } = data;

  return (
    <>
      <Head>
        <title>Dashboard - WorkflowS</title>
      </Head>
      <div class="min-h-screen bg-gray-100">
        <nav class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
              <div class="flex">
                <div class="flex-shrink-0 flex items-center">
                  <h1 class="text-xl font-bold text-blue-600">WorkflowS</h1>
                </div>
                <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <a
                    href="/dashboard"
                    class="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/projects"
                    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Proyectos
                  </a>
                  <a
                    href="/teams"
                    class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Equipos
                  </a>
                </div>
              </div>
              <div class="hidden sm:ml-6 sm:flex sm:items-center">
                <div class="ml-3 relative">
                  <div class="flex items-center">
                    <span class="text-sm font-medium text-gray-700 mr-2">
                      {user.name}
                    </span>
                    <a
                      href="/auth/logout"
                      class="ml-2 px-3 py-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Cerrar Sesión
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div class="py-10">
          <header>
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 class="text-3xl font-bold leading-tight text-gray-900">
                Dashboard
              </h1>
            </div>
          </header>
          <main>
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <div class="px-4 py-8 sm:px-0">
                <div class="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div class="px-4 py-5 sm:px-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                      Información del Usuario
                    </h3>
                    <p class="mt-1 max-w-2xl text-sm text-gray-500">
                      Detalles personales y de la cuenta.
                    </p>
                  </div>
                  <div class="border-t border-gray-200">
                    <dl>
                      <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt class="text-sm font-medium text-gray-500">
                          Nombre completo
                        </dt>
                        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {user.name}
                        </dd>
                      </div>
                      <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt class="text-sm font-medium text-gray-500">
                          Correo electrónico
                        </dt>
                        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {user.email}
                        </dd>
                      </div>
                      <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt class="text-sm font-medium text-gray-500">
                          Rol
                        </dt>
                        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {user.role === "admin" ? "Administrador" : 
                           user.role === "scrum_master" ? "Scrum Master" : 
                           user.role === "product_owner" ? "Product Owner" : 
                           "Team Developer"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div class="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                  <div class="px-4 py-5 sm:px-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                      Resumen de Actividad
                    </h3>
                    <p class="mt-1 max-w-2xl text-sm text-gray-500">
                      Información general sobre tus proyectos y tareas.
                    </p>
                  </div>
                  <div class="border-t border-gray-200">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                      <div class="bg-blue-50 p-4 rounded-lg">
                        <h4 class="text-lg font-medium text-blue-800">Proyectos</h4>
                        <p class="text-3xl font-bold text-blue-600">0</p>
                        <p class="text-sm text-blue-500">Proyectos activos</p>
                      </div>
                      <div class="bg-green-50 p-4 rounded-lg">
                        <h4 class="text-lg font-medium text-green-800">Tareas</h4>
                        <p class="text-3xl font-bold text-green-600">0</p>
                        <p class="text-sm text-green-500">Tareas asignadas</p>
                      </div>
                      <div class="bg-purple-50 p-4 rounded-lg">
                        <h4 class="text-lg font-medium text-purple-800">Equipos</h4>
                        <p class="text-3xl font-bold text-purple-600">0</p>
                        <p class="text-sm text-purple-500">Equipos activos</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}