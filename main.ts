/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";
import { initDatabase, closeDatabase } from "./utils/db.ts";

// Inicializar la conexión a la base de datos
await initDatabase();

// Registrar un manejador para cerrar la conexión a la base de datos cuando la aplicación se cierre
Deno.addSignalListener("SIGINT", async () => {
  console.log("Shutting down...");
  await closeDatabase();
  Deno.exit(0);
});

// Iniciar el servidor
await start(manifest, config);
