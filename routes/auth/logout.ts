import type { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(_req, _ctx) {
    // Eliminar la cookie de sesión
    const headers = new Headers();
    headers.set("location", "/");

    // Establecer la cookie con un valor vacío y una fecha de expiración en el pasado
    headers.set(
      "Set-Cookie",
      "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
    );

    return new Response(null, {
      status: 303,
      headers,
    });
  },
};