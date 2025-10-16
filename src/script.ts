import { testConnection } from "./db/db.ts";

// Función principal para ejecutar el script
async function main() {
	try {
		console.log("Probando conexión a la base de datos...");
		const connected = await testConnection();
		if (connected) {
			console.log("Conexión exitosa");
		} else {
			console.log("Error en la conexión");
		}
	} catch (error) {
		console.error("Error al ejecutar el script:", error);
	}
}

// Ejecutar la función principal
await main();
