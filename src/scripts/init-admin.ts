#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * Script para inicializar un usuario administrador en la base de datos
 * 
 * Este script debe ejecutarse después de clonar el repositorio y configurar la base de datos.
 * Crea un usuario administrador con credenciales predeterminadas.
 * 
 * Uso:
 *   deno run --allow-net --allow-env --allow-read src/scripts/init-admin.ts
 */

import { initializeAdminUser } from "../db/init.ts";
import { config } from "../utils/env.ts";

console.log("🔧 Inicializando usuario administrador...");
console.log(`🌐 Conectando a la base de datos: ${config.DATABASE_URL.split("@")[1].split("/")[0]}`);

try {
  await initializeAdminUser();
  console.log("✅ Usuario administrador creado correctamente.");
  console.log("📝 Credenciales por defecto:");
  console.log("   - Email: admin@workflow.com");
  console.log("   - Contraseña: admin123");
  console.log("⚠️  Por seguridad, cambia estas credenciales después de iniciar sesión.");
} catch (error) {
  console.error("❌ Error al crear usuario administrador:", error);
  Deno.exit(1);
}

Deno.exit(0);