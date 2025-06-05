import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.ts";

// Create a PostgreSQL connection pool
const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "123456",
  database: "workflow_db",
});

// Create a Drizzle ORM instance
export const db = drizzle(pool, { schema });

// Helper function to test the database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("Successfully connected to PostgreSQL");
    client.release();
    return true;
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error);
    return false;
  }
}

// Close the pool (call this when shutting down the application)
export async function closePool() {
  await pool.end();
}