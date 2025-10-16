// Script para probar la conexión a la base de datos de Neon Tech
import { load } from "$std/dotenv/mod.ts";
import pg from "pg";

// Cargar variables de entorno
await load({ export: true });

const { Pool } = pg;

// Obtener la URL de conexión
const connectionString = Deno.env.get("DATABASE_URL") || "";
console.log("URL de conexión:", connectionString.replace(/:[^:@]*@/, ":****@")); // Ocultar la contraseña

async function testConnection() {
	console.log("Probando conexión a la base de datos...");
	console.log("SSL habilitado: true");

	try {
		// Crear un pool de conexiones
		const pool = new Pool({
			connectionString,
			ssl: true,
		});

		// Intentar ejecutar una consulta simple
		const result = await pool.query("SELECT NOW() as current_time");
		console.log("Conexión exitosa!");
		console.log("Hora actual del servidor:", result.rows[0].current_time);

		// Cerrar la conexión
		await pool.end();
		return true;
	} catch (error) {
		console.error("Error al conectar a la base de datos:", error);
		return false;
	}
}

// Ejecutar la prueba de conexión
await testConnection();
