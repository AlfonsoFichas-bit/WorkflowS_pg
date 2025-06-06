import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { createUser } from "../../src/db/db.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

interface RegisterData {
  success?: boolean;
  message?: string;
  errors?: {
    name?: string;
    paternalLastName?: string;
    maternalLastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    username?: string;
  };
}

export const handler: Handlers<RegisterData> = {
  async POST(req, ctx) {
    const form = await req.formData();
    const name = form.get("name")?.toString() || "";
    const paternalLastName = form.get("paternalLastName")?.toString() || "";
    const maternalLastName = form.get("maternalLastName")?.toString() || "";
    const email = form.get("email")?.toString() || "";
    const password = form.get("password")?.toString() || "";
    const confirmPassword = form.get("confirmPassword")?.toString() || "";
    const username = form.get("username")?.toString() || "";
    // Asignar el rol de administrador por defecto
    const role = "admin";

    // Validate form data
    const errors: RegisterData["errors"] = {};

    if (!name) errors.name = "El nombre es requerido";
    if (!paternalLastName) errors.paternalLastName = "El apellido paterno es requerido";
    if (!email) errors.email = "El correo electrónico es requerido";
    if (!password) errors.password = "La contraseña es requerida";
    if (password !== confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
    }
    if (!username) errors.username = "El nombre de usuario es requerido";

    // If there are errors, return them
    if (Object.keys(errors).length > 0) {
      return ctx.render({ errors });
    }

    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password);

      // Create the user
      await createUser({
        name,
        paternalLastName,
        maternalLastName,
        email,
        password: hashedPassword,
        role,
      });

      // Redirect to login page
      const headers = new Headers();
      headers.set("location", "/auth/login?registered=true");
      return new Response(null, {
        status: 303,
        headers,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return ctx.render({
        success: false,
        message: "Error al crear el usuario. Por favor, inténtalo de nuevo.",
      });
    }
  },
  GET(_req, ctx) {
    return ctx.render({});
  },
};

export default function Register({ data }: PageProps<RegisterData>) {
  const { errors, message } = data || {};

  return (
    <>
      <Head>
        <title>Registrarse - WorkflowS</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div class="text-center">
            <h1 class="text-3xl font-bold text-gray-900 mb-6">
              Crear una Cuenta
            </h1>
            {message && (
              <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {message}
              </div>
            )}
          </div>

          <form class="space-y-6" method="POST">
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700">
                  Nombre*
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors?.name && (
                  <p class="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="paternalLastName" class="block text-sm font-medium text-gray-700">
                  Apellido Paterno*
                </label>
                <input
                  id="paternalLastName"
                  name="paternalLastName"
                  type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors?.paternalLastName && (
                  <p class="mt-1 text-sm text-red-600">{errors.paternalLastName}</p>
                )}
              </div>
              <div>
                <label for="maternalLastName" class="block text-sm font-medium text-gray-700">
                  Apellido Materno
                </label>
                <input
                  id="maternalLastName"
                  name="maternalLastName"
                  type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* El rol de administrador se asigna automáticamente */}
            <input type="hidden" name="role" value="admin" />

            <div class="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              <div class="flex">
                <div class="flex-shrink-0">
                  <span class="material-symbols-outlined">info</span>
                </div>
                <div class="ml-3">
                  <p class="text-sm">
                    Todos los usuarios registrados tendrán rol de <strong>Administrador</strong> por defecto.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label for="username" class="block text-sm font-medium text-gray-700">
                Nombre de Usuario*
              </label>
              <input
                id="username"
                name="username"
                type="text"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors?.username && (
                <p class="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Correo Electrónico*
              </label>
              <input
                id="email"
                name="email"
                type="email"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors?.email && (
                <p class="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                Contraseña*
              </label>
              <input
                id="password"
                name="password"
                type="password"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors?.password && (
                <p class="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                Confirmar Contraseña*
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors?.confirmPassword && (
                <p class="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Registrarse
              </button>
            </div>
          </form>

          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{" "}
              <a href="/auth/login" class="font-medium text-blue-600 hover:text-blue-500">
                Iniciar sesión
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}