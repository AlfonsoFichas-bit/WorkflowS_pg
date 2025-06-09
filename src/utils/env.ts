// Environment variable configuration
// Load and validate environment variables
import { load } from "$std/dotenv/mod.ts";

// Define the shape of our environment variables
export interface EnvConfig {
  DATABASE_URL: string;
  PORT: string;
  ENV: string;
  // Add other environment variables as needed
}

// Load environment variables with fallbacks for development
export function loadEnvConfig(): EnvConfig {
  try {
    // Try to load .env file
    load({ export: true, allowEmptyValues: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("Warning: .env file not loaded:", errorMessage);
  }
  
  const isDev = Deno.env.get("ENV") !== "production";
  
  // Get environment variables with fallbacks for development
  const DATABASE_URL = Deno.env.get("DATABASE_URL") || 
    (isDev ? "postgresql://workflow_db_owner:npg_XIvlGxrM2P8W@ep-weathered-tree-aclucr15-pooler.sa-east-1.aws.neon.tech/workflow_db?sslmode=require" : "");
  
  const PORT = Deno.env.get("PORT") || "8000";
  const ENV = Deno.env.get("ENV") || "development";
  
  // In production, validate required environment variables
  if (!isDev && !DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required in production");
  }
  
  return {
    DATABASE_URL,
    PORT,
    ENV,
    // Add other environment variables here
  };
}

// Export a singleton instance of the config
export const config = loadEnvConfig();