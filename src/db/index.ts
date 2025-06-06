// Database connection and client setup
// This file exports the database client and all necessary functions

// Export everything from db.ts
export * from "./db.ts";

// Export schemas and relations
export * from "./schema/index.ts";
export * from "./relations.ts";

// Export migration utilities
export { default as migrate } from "./migrate.ts";