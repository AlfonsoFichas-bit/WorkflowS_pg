import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { getUserByEmail } from "../../src/db/db.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

interface LoginData {
  success?: boolean;
  message?: string;
  registered?: boolean;
  errors?: {
    email?: string;
    password?: string;
  };
}

export const handler: Handlers<LoginData> = {
  async POST(req, ctx) {
    const form = await req.formData();
    const email = form.get("email")?.toString() || "";
    const password = form.get("password")?.toString() || "";

    // Validate form data
    const errors: LoginData["errors"] = {};

    if (!email) errors.email = "El correo electrónico es requerido";
    if (!password) errors.password = "La contraseña es requerida";

    // If there are errors, return them
    if (Object.keys(errors).length > 0) {
      return ctx.render({ errors });
    }

    try {
      // Get the user by email
      const users = await getUserByEmail(email);

      if (users.length === 0) {
        return ctx.render({
          success: false,
          message: "Correo electrónico o contraseña incorrectos",
        });
      }

      const user = users[0];

      // Verify the password
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return ctx.render({
          success: false,
          message: "Correo electrónico o contraseña incorrectos",
        });
      }

      // Create a session cookie with user information
      const headers = new Headers();
      headers.set("location", "/dashboard");

      // Create a simple session cookie with user information
      // In a real app, you would use a more secure session management system
      const sessionData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      // Set the cookie with user data (encoded as JSON and base64)
      headers.set(
        "Set-Cookie",
        `session=${btoa(JSON.stringify(sessionData))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
      );

      return new Response(null, {
        status: 303,
        headers,
      });
    } catch (error) {
      console.error("Error logging in:", error);
      return ctx.render({
        success: false,
        message: "Error al iniciar sesión. Por favor, inténtalo de nuevo.",
      });
    }
  },
  GET(req, ctx) {
    const url = new URL(req.url);
    const registered = url.searchParams.get("registered") === "true";

    return ctx.render({
      registered,
    });
  },
};

export default function Login({ data }: PageProps<LoginData>) {
  const { errors, message, registered } = data || {};

  return (
    <>
      <Head>
        <title>Iniciar Sesión - WorkflowS</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div class="text-center">
            <h1 class="text-3xl font-bold text-gray-900 mb-6">
              Iniciar Sesión
            </h1>
            {message && (
              <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {message}
              </div>
            )}
            {registered && (
              <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                Cuenta creada exitosamente. Ahora puedes iniciar sesión.
              </div>
            )}
          </div>

          <form class="space-y-6" method="POST">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Correo Electrónico
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
                Contraseña
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

            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                  Recordarme
                </label>
              </div>

              <div class="text-sm">
                <a href="#" class="font-medium text-blue-600 hover:text-blue-500">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Iniciar Sesión
              </button>
            </div>
          </form>

          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              ¿No tienes una cuenta?{" "}
              <a href="/auth/register" class="font-medium text-blue-600 hover:text-blue-500">
                Registrarse
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}