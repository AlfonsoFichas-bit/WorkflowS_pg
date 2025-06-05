import { db, testConnection, closePool } from "../db/db.ts";

// Export everything from the database services
export * from "../db/services.ts";

// Export the database instance
export { db };

// Initialize the database connection
export async function initDatabase() {
  const isConnected = await testConnection();

  if (!isConnected) {
    console.error("Failed to connect to the database. Please check your configuration.");
    Deno.exit(1);
  }

  console.log("Database connection established successfully.");
  return db;
}

// Close the database connection when the application shuts down
export async function closeDatabase() {
  await closePool();
  console.log("Database connection closed.");
}