import { DashboardLayout } from "../../components/DashboardLayout.tsx";
import { MaterialSymbol } from "../../components/MaterialSymbol.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import { State } from "./_middleware.ts";

interface IconsData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    formattedRole: string;
  };
}

export const handler: Handlers<IconsData, State> = {
  GET(_req, ctx) {
    // El middleware ya ha verificado la autenticación y ha añadido el usuario al estado
    return ctx.render({
      user: ctx.state.user,
    });
  },
};

export default function IconsDemo({ data }: PageProps<IconsData>) {
  const { user } = data;
  // Iconos de ejemplo para mostrar
  const demoIcons = [
    "dashboard",
    "folder",
    "task",
    "group",
    "person",
    "logout",
    "settings",
    "home",
    "search",
    "notifications",
    "favorite",
    "star",
    "delete",
    "edit",
    "add",
    "remove",
    "check",
    "close",
    "menu",
    "arrow_back",
    "arrow_forward",
    "light_mode",
    "dark_mode",
  ];

  return (
    <DashboardLayout user={user}>
      <div class="space-y-8">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">Material Symbols</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Demostración de los iconos de Google Material Symbols
          </p>
        </div>

        {/* Explicación de los ejes */}
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-4">Ejes de Material Symbols</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="text-lg font-medium mb-2">Eje FILL</h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4">
                El relleno te permite modificar el diseño predeterminado del ícono. Un solo icono puede renderizar estados sin completar y con relleno.
              </p>
              <div class="flex items-center gap-6 mt-4">
                <div class="flex flex-col items-center">
                  <MaterialSymbol icon="favorite" className="text-3xl text-red-500" fill={0} />
                  <span class="text-sm mt-2">fill=0</span>
                </div>
                <div class="flex flex-col items-center">
                  <MaterialSymbol icon="favorite" className="text-3xl text-red-500" fill={1} />
                  <span class="text-sm mt-2">fill=1</span>
                </div>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-medium mb-2">Eje wght (Weight)</h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4">
                El grosor define el grosor del trazo del símbolo, con un rango de grosores entre delgado (100) y en negrita (700).
              </p>
              <div class="flex items-center gap-6 mt-4">
                <div class="flex flex-col items-center">
                  <MaterialSymbol icon="star" className="text-3xl text-yellow-500" weight={100} />
                  <span class="text-sm mt-2">weight=100</span>
                </div>
                <div class="flex flex-col items-center">
                  <MaterialSymbol icon="star" className="text-3xl text-yellow-500" weight={400} />
                  <span class="text-sm mt-2">weight=400</span>
                </div>
                <div class="flex flex-col items-center">
                  <MaterialSymbol icon="star" className="text-3xl text-yellow-500" weight={700} />
                  <span class="text-sm mt-2">weight=700</span>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <h3 class="text-lg font-medium mb-2">Eje GRAD (Grade)</h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4">
                La calificación afecta el grosor de un símbolo de manera más granular que el peso y tiene un pequeño impacto en el tamaño del símbolo.
              </p>
              <div class="flex items-center gap-6 mt-4">
                <div class="flex flex-col items-center">
                  <MaterialSymbol icon="settings" className="text-3xl text-blue-500" grade={-25} />
                  <span class="text-sm mt-2">grade=-25</span>
                </div>
                <div class="flex flex-col items-center">
                  <MaterialSymbol icon="settings" className="text-3xl text-blue-500" grade={0} />
                  <span class="text-sm mt-2">grade=0</span>
                </div>
                <div class="flex flex-col items-center">
                  <MaterialSymbol icon="settings" className="text-3xl text-blue-500" grade={200} />
                  <span class="text-sm mt-2">grade=200</span>
                </div>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-medium mb-2">Eje opsz (Optical Size)</h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4">
                El tamaño óptico ofrece una forma de ajustar el grosor del trazo cuando aumentes o disminuyas el tamaño de los símbolos.
              </p>
              <div class="flex items-center gap-6 mt-4">
                <div class="flex flex-col items-center">
                  <MaterialSymbol icon="home" className="text-3xl text-green-500" opticalSize={20} />
                  <span class="text-sm mt-2">opticalSize=20</span>
                </div>
                <div class="flex flex-col items-center">
                  <MaterialSymbol icon="home" className="text-3xl text-green-500" opticalSize={24} />
                  <span class="text-sm mt-2">opticalSize=24</span>
                </div>
                <div class="flex flex-col items-center">
                  <MaterialSymbol icon="home" className="text-3xl text-green-500" opticalSize={48} />
                  <span class="text-sm mt-2">opticalSize=48</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Galería de iconos */}
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-4">Galería de Iconos</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {demoIcons.map((icon) => (
              <div key={icon} class="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <MaterialSymbol icon={icon} className="text-3xl text-blue-600 dark:text-blue-400 mb-2" />
                <span class="text-sm text-center">{icon}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Combinaciones de ejes */}
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-4">Combinaciones de Ejes</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <MaterialSymbol 
                icon="favorite" 
                className="text-4xl text-red-500 mb-2" 
                fill={1}
                weight={700}
                grade={200}
                opticalSize={48}
              />
              <span class="text-sm text-center font-medium">Énfasis Máximo</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                fill=1, weight=700, grade=200, opticalSize=48
              </span>
            </div>
            <div class="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <MaterialSymbol 
                icon="favorite" 
                className="text-4xl text-red-500 mb-2" 
                fill={0}
                weight={400}
                grade={0}
                opticalSize={24}
              />
              <span class="text-sm text-center font-medium">Estilo Estándar</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                fill=0, weight=400, grade=0, opticalSize=24
              </span>
            </div>
            <div class="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <MaterialSymbol 
                icon="favorite" 
                className="text-4xl text-red-500 mb-2" 
                fill={0}
                weight={100}
                grade={-25}
                opticalSize={20}
              />
              <span class="text-sm text-center font-medium">Énfasis Mínimo</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                fill=0, weight=100, grade=-25, opticalSize=20
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}