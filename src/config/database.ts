// Database configuration for the application
// This will be used to configure Drizzle ORM

import { config } from "../utils/env.ts";

// Check if the connection string contains SSL mode
const hasSSLMode = config.DATABASE_URL.includes("sslmode=");

// Database configuration with development defaults
export const databaseConfig = {
	connectionString: config.DATABASE_URL,
	// Add any additional database configuration here
	ssl: hasSSLMode ? undefined : config.ENV === "production", // Use SSL mode from connection string if present, otherwise enable only in production
	debug: config.ENV === "development", // Enable debug in development
};

// This is a placeholder for the database client
// It will be replaced with the actual Drizzle ORM implementation
export const getDbClient = () => {
	console.log(
		"Database client placeholder - will be implemented with Drizzle ORM",
	);
	return {
		// Mock methods for development
		query: () => [],
		connect: () => console.log("Connected to database (mock)"),
		disconnect: () => console.log("Disconnected from database (mock)"),
	};
};
