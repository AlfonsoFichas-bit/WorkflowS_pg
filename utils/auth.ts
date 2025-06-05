/**
 * Obtiene los datos de la sesión del usuario a partir de la cookie
 */
export function getSessionData(req: Request) {
  try {
    // Obtener la cookie de sesión
    const cookies = req.headers.get("cookie") || "";
    const sessionCookie = cookies
      .split(";")
      .find((cookie) => cookie.trim().startsWith("session="));

    if (!sessionCookie) {
      return null;
    }

    // Extraer el valor de la cookie
    const sessionValue = sessionCookie.split("=")[1].trim();
    
    // Decodificar el valor (base64 y JSON)
    const sessionData = JSON.parse(atob(sessionValue));
    
    return sessionData;
  } catch (error) {
    console.error("Error al obtener los datos de sesión:", error);
    return null;
  }
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(req: Request) {
  return getSessionData(req) !== null;
}

/**
 * Crea una respuesta de redirección
 */
export function redirect(location: string, headers = new Headers()) {
  headers.set("location", location);
  return new Response(null, {
    status: 303,
    headers,
  });
}

/**
 * Middleware para proteger rutas que requieren autenticación
 */
export function requireAuth(req: Request) {
  if (!isAuthenticated(req)) {
    return redirect("/auth/login");
  }
  return null;
}

/**
 * Formatea el rol del usuario para mostrarlo de manera más amigable
 */
export function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    "admin": "Administrador",
    "scrum_master": "Scrum Master",
    "product_owner": "Product Owner",
    "team_developer": "Team Developer"
  };
  
  return roleMap[role] || role;
}