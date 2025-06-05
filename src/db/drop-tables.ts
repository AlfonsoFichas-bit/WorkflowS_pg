import pg from "pg";

const { Pool } = pg;

// Crear el pool de conexiones
const pool = new Pool({
  connectionString: Deno.env.get("DATABASE_URL"),
});

// Función principal para eliminar todas las tablas
async function main() {
  try {
    console.log("Conectando a la base de datos...");
    const client = await pool.connect();
    
    try {
      console.log("Eliminando todas las tablas...");
      
      // Desactivar las restricciones de clave foránea temporalmente
      await client.query("SET session_replication_role = 'replica';");
      
      // Eliminar todas las tablas
      await client.query(`
        DROP TABLE IF EXISTS 
          comments, 
          evaluations, 
          tasks, 
          sprints, 
          team_members, 
          teams, 
          projects, 
          users, 
          dinosaurs
        CASCADE;
      `);
      
      // Reactivar las restricciones de clave foránea
      await client.query("SET session_replication_role = 'origin';");
      
      console.log("Todas las tablas han sido eliminadas con éxito");
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al eliminar las tablas:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar la función principal
await main();