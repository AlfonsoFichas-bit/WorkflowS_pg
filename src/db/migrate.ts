import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db.ts";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Obtener el directorio actual
const __dirname = dirname(fileURLToPath(import.meta.url));

// Ruta a los archivos de migración
const migrationsFolder = join(__dirname, "../../drizzle");

// Función principal para ejecutar las migraciones
async function main() {
  console.log("Aplicando migraciones...");
  console.log("Directorio de migraciones:", migrationsFolder);
  
  try {
    // Aplicar las migraciones
    await migrate(db, { migrationsFolder });
    console.log("Migraciones aplicadas con éxito");
  } catch (error) {
    console.error("Error al aplicar las migraciones:", error);
    throw error;
  } finally {
    // Cerrar la conexión a la base de datos
    // En Drizzle con Deno, no necesitamos cerrar la conexión explícitamente
    console.log("Proceso de migración completado");
  }
}

// Ejecutar la función principal
await main();