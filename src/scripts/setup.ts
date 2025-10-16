#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-run

/**
 * Script de configuración inicial para WorkflowS
 *
 * Este script debe ejecutarse después de clonar el repositorio.
 * Realiza las siguientes tareas:
 * 1. Verifica la conexión a la base de datos
 * 2. Ejecuta las migraciones de la base de datos
 * 3. Crea un usuario administrador por defecto
 *
 * Uso:
 *   deno run --allow-net --allow-env --allow-read --allow-run src/scripts/setup.ts
 */

import { config as _config } from "../utils/env.ts";

console.log("🚀 Iniciando configuración de WorkflowS...");
console.log("📋 Verificando requisitos...");

// Verificar que Deno está instalado (implícito ya que estamos ejecutando este script)
console.log("✅ Deno está instalado");

// Verificar la conexión a la base de datos
console.log("🔍 Verificando conexión a la base de datos...");
try {
	const testConnection = new Deno.Command("deno", {
		args: [
			"run",
			"--allow-net",
			"--allow-env",
			"--allow-read",
			"src/test-connection.ts",
		],
	});

	const { code: testCode } = await testConnection.output();

	if (testCode !== 0) {
		throw new Error("No se pudo conectar a la base de datos");
	}

	console.log("✅ Conexión a la base de datos establecida");
} catch (error) {
	console.error("❌ Error al conectar con la base de datos:", error);
	console.log(
		"📝 Asegúrate de que la variable DATABASE_URL está configurada correctamente en el archivo .env",
	);
	Deno.exit(1);
}

// Ejecutar migraciones
console.log("🔄 Ejecutando migraciones de la base de datos...");
try {
	const migrate = new Deno.Command("deno", {
		args: [
			"run",
			"--allow-net",
			"--allow-env",
			"--allow-read",
			"src/db/migrate.ts",
		],
	});

	const { code: migrateCode } = await migrate.output();

	if (migrateCode !== 0) {
		throw new Error("Error al ejecutar las migraciones");
	}

	console.log("✅ Migraciones ejecutadas correctamente");
} catch (error) {
	console.error("❌ Error al ejecutar las migraciones:", error);
	Deno.exit(1);
}

// Crear usuario administrador
console.log("👤 Creando usuario administrador por defecto...");
try {
	const initAdmin = new Deno.Command("deno", {
		args: [
			"run",
			"--allow-net",
			"--allow-env",
			"--allow-read",
			"src/scripts/init-admin.ts",
		],
	});

	const { code: adminCode } = await initAdmin.output();

	if (adminCode !== 0) {
		throw new Error("Error al crear el usuario administrador");
	}

	console.log("✅ Usuario administrador creado correctamente");
	console.log("📝 Credenciales por defecto:");
	console.log("   - Email: admin@workflow.com");
	console.log("   - Contraseña: admin123");
	console.log(
		"⚠️  Por seguridad, cambia estas credenciales después de iniciar sesión.",
	);
} catch (error) {
	console.error("❌ Error al crear el usuario administrador:", error);
	Deno.exit(1);
}

console.log("🎉 ¡Configuración completada con éxito!");
console.log("🚀 Para iniciar la aplicación, ejecuta: deno task start");

Deno.exit(0);
