import { Head } from "$fresh/runtime.ts";
import { Handlers } from "$fresh/server.ts";
import { isAuthenticated } from "../utils/auth.ts";

export const handler: Handlers = {
  GET(req, ctx) {
    // Si el usuario está autenticado, redirigir al dashboard
    if (isAuthenticated(req)) {
      const headers = new Headers();
      headers.set("location", "/dashboard");
      return new Response(null, {
        status: 303,
        headers,
      });
    }
    
    return ctx.render();
  },
};

export default function Home() {
  return (
    <>
      <Head>
        <title>WorkflowS - Gestión de Proyectos Ágiles</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700">
        <header class="bg-white shadow-md">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div class="flex items-center">
              <h1 class="text-2xl font-bold text-blue-600">WorkflowS</h1>
            </div>
            <div class="flex space-x-4">
              <a
                href="/auth/login"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Iniciar Sesión
              </a>
              <a
                href="/auth/register"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Registrarse
              </a>
            </div>
          </div>
        </header>

        <main>
          <div class="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
            <div class="text-center">
              <h2 class="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                Gestión de Proyectos Ágiles
              </h2>
              <p class="mt-5 max-w-xl mx-auto text-xl text-blue-100">
                Simplifica la gestión de tus proyectos con metodologías ágiles.
                Organiza sprints, asigna tareas y colabora con tu equipo de manera eficiente.
              </p>
              <div class="mt-10">
                <a
                  href="/auth/register"
                  class="px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10"
                >
                  Comenzar Ahora
                </a>
              </div>
            </div>

            <div class="mt-20">
              <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div class="bg-white rounded-lg shadow-lg p-6">
                  <div class="text-center">
                    <h3 class="text-xl font-bold text-gray-900 mt-4">Gestión de Sprints</h3>
                    <p class="mt-2 text-gray-600">
                      Planifica y organiza tus sprints de manera eficiente. Establece fechas, objetivos y realiza seguimiento del progreso.
                    </p>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow-lg p-6">
                  <div class="text-center">
                    <h3 class="text-xl font-bold text-gray-900 mt-4">Asignación de Tareas</h3>
                    <p class="mt-2 text-gray-600">
                      Asigna tareas a los miembros del equipo, establece prioridades y realiza un seguimiento del estado de cada tarea.
                    </p>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow-lg p-6">
                  <div class="text-center">
                    <h3 class="text-xl font-bold text-gray-900 mt-4">Colaboración en Equipo</h3>
                    <p class="mt-2 text-gray-600">
                      Facilita la comunicación y colaboración entre los miembros del equipo. Comparte información y mantén a todos actualizados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer class="bg-white">
          <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <p class="text-center text-gray-500">
              &copy; 2024 WorkflowS. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}