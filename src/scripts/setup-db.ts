#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * Script para configurar la base de datos y crear un usuario administrador
 * 
 * Este script debe ejecutarse después de clonar el repositorio.
 * Realiza las siguientes tareas:
 * 1. Elimina todas las tablas existentes para garantizar una estructura limpia
 * 2. Crea todas las tablas con la estructura correcta
 * 3. Crea un usuario administrador por defecto
 * 
 * Uso:
 *   deno run --allow-net --allow-env --allow-read src/scripts/setup-db.ts
 */

import { db } from "../db/db.ts";
import { createUser, getUserByEmail } from "../db/db.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { config } from "../utils/env.ts";

console.log("🚀 Iniciando configuración de la base de datos...");
console.log(`🌐 Conectando a la base de datos: ${config.DATABASE_URL.split("@")[1].split("/")[0]}`);

// Función para crear el usuario administrador
async function createAdminUser() {
  console.log("👤 Creando usuario administrador...");
  
  try {
    const adminEmail = "admin@workflow.com";
    
    // Verificar si el usuario ya existe
    const existingUser = await getUserByEmail(adminEmail);
    if (existingUser && existingUser.length > 0) {
      console.log("ℹ️ El usuario administrador ya existe, no es necesario crearlo.");
      return true;
    }
    
    const adminPassword = await bcrypt.hash("admin123");

    await createUser({
      name: "Admin",
      paternalLastName: "System",
      maternalLastName: "User",
      email: adminEmail,
      password: adminPassword,
      role: "admin"
    });

    console.log("✅ Usuario administrador creado correctamente.");
    console.log("📝 Credenciales por defecto:");
    console.log("   - Email: admin@workflow.com");
    console.log("   - Contraseña: admin123");
    console.log("⚠️  Por seguridad, cambia estas credenciales después de iniciar sesión.");
    return true;
  } catch (error) {
    console.error("❌ Error al crear usuario administrador:", error);
    return false;
  }
}

// Función para verificar si una tabla existe
async function checkTableExists(tableName: string) {
  try {
    console.log(`🔍 Verificando si la tabla '${tableName}' existe...`);
    
    // Intentar ejecutar una consulta simple para verificar si la tabla existe
    const result = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = '${tableName}'
      );
    `);
    
    const exists = result.rows[0][0];
    
    if (exists) {
      console.log(`✅ La tabla '${tableName}' existe.`);
      return true;
    }
    
    console.log(`❌ La tabla '${tableName}' no existe.`);
    return false;
  } catch (error) {
    console.error(`❌ Error al verificar la tabla '${tableName}':`, error);
    return false;
  }
}

// Función para verificar si una columna existe en una tabla
// Prefijada con _ porque actualmente no se usa pero podría ser útil en el futuro
async function _checkColumnExists(tableName: string, columnName: string) {
  try {
    console.log(`🔍 Verificando si la columna '${columnName}' existe en la tabla '${tableName}'...`);
    
    // Intentar ejecutar una consulta simple para verificar si la columna existe
    const result = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = '${tableName}'
        AND column_name = '${columnName}'
      );
    `);
    
    const exists = result.rows[0][0];
    
    if (exists) {
      console.log(`✅ La columna '${columnName}' existe en la tabla '${tableName}'.`);
      return true;
    }
    
    console.log(`❌ La columna '${columnName}' no existe en la tabla '${tableName}'.`);
    return false;
  } catch (error) {
    console.error(`❌ Error al verificar la columna '${columnName}' en la tabla '${tableName}':`, error);
    return false;
  }
}

// Función para crear todas las tablas manualmente si es necesario
async function createAllTables() {
  try {
    console.log("🔧 Creando todas las tablas manualmente...");
    
    // Crear tabla users
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "paternal_last_name" varchar(255) DEFAULT '',
        "maternal_last_name" varchar(255) DEFAULT '',
        "email" varchar(255) NOT NULL,
        "password" varchar(255) NOT NULL,
        "role" varchar(50) DEFAULT 'team_developer' NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "users_email_unique" UNIQUE("email")
      );
    `);
    console.log("✅ Tabla 'users' creada correctamente.");
    
    // Crear tabla projects
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "owner_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id")
      );
    `);
    console.log("✅ Tabla 'projects' creada correctamente.");
    
    // Crear tabla teams
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "teams" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "project_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "teams_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id")
      );
    `);
    console.log("✅ Tabla 'teams' creada correctamente.");
    
    // Crear tabla team_members
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "team_members" (
        "id" serial PRIMARY KEY NOT NULL,
        "team_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "role" varchar(50) DEFAULT 'team_member' NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id"),
        CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
      );
    `);
    console.log("✅ Tabla 'team_members' creada correctamente.");
    
    // Crear tabla sprints
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "sprints" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "project_id" integer NOT NULL,
        "start_date" timestamp NOT NULL,
        "end_date" timestamp NOT NULL,
        "status" varchar(50) DEFAULT 'planned' NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "sprints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id")
      );
    `);
    console.log("✅ Tabla 'sprints' creada correctamente.");
    
    // Crear tabla tasks
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "sprint_id" integer,
        "assignee_id" integer,
        "status" varchar(50) DEFAULT 'todo' NOT NULL,
        "priority" varchar(50) DEFAULT 'medium' NOT NULL,
        "story_points" integer,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "tasks_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id"),
        CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id")
      );
    `);
    console.log("✅ Tabla 'tasks' creada correctamente.");
    
    // Crear tabla comments
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "comments" (
        "id" serial PRIMARY KEY NOT NULL,
        "content" text NOT NULL,
        "task_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id"),
        CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
      );
    `);
    console.log("✅ Tabla 'comments' creada correctamente.");
    
    // Crear tabla evaluations
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "evaluations" (
        "id" serial PRIMARY KEY NOT NULL,
        "project_id" integer NOT NULL,
        "team_id" integer NOT NULL,
        "evaluator_id" integer NOT NULL,
        "score" integer NOT NULL,
        "feedback" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "evaluations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id"),
        CONSTRAINT "evaluations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id"),
        CONSTRAINT "evaluations_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "users"("id")
      );
    `);
    console.log("✅ Tabla 'evaluations' creada correctamente.");
    
    // Crear tabla user_stories
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "user_stories" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "acceptance_criteria" text,
        "project_id" integer NOT NULL,
        "sprint_id" integer,
        "status" varchar(50) DEFAULT 'pending' NOT NULL,
        "priority" varchar(50) DEFAULT 'medium' NOT NULL,
        "story_points" integer,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "user_stories_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id"),
        CONSTRAINT "user_stories_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id")
      );
    `);
    console.log("✅ Tabla 'user_stories' creada correctamente.");
    
    // Crear tabla rubrics
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "rubrics" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "creator_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "rubrics_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id")
      );
    `);
    console.log("✅ Tabla 'rubrics' creada correctamente.");
    
    // Crear tabla rubric_criteria
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "rubric_criteria" (
        "id" serial PRIMARY KEY NOT NULL,
        "rubric_id" integer NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "max_score" integer NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "rubric_criteria_rubric_id_fkey" FOREIGN KEY ("rubric_id") REFERENCES "rubrics"("id")
      );
    `);
    console.log("✅ Tabla 'rubric_criteria' creada correctamente.");
    
    console.log("✅ Todas las tablas creadas correctamente.");
    return true;
  } catch (error) {
    console.error("❌ Error al crear las tablas:", error);
    return false;
  }
}

// Función principal
async function main() {
  try {
    console.log("🔄 Iniciando configuración completa de la base de datos...");
    
    // Paso 1: Verificar si las tablas existen y eliminarlas una por una
    console.log("🔍 Verificando y eliminando tablas existentes...");
    
    // Lista de tablas en orden para eliminar (respetando las restricciones de clave foránea)
    const tablesToDrop = [
      "comments",
      "evaluations",
      "team_members",
      "tasks",
      "user_stories",
      "rubric_criteria",
      "rubrics",
      "teams",
      "sprints",
      "projects",
      "users"
    ];
    
    // Eliminar cada tabla con CASCADE para evitar problemas de dependencias
    for (const table of tablesToDrop) {
      try {
        // Verificar si la tabla existe antes de intentar eliminarla
        const tableExists = await checkTableExists(table);
        if (tableExists) {
          await db.execute(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
          console.log(`✅ Tabla '${table}' eliminada correctamente.`);
        } else {
          console.log(`ℹ️ La tabla '${table}' no existe, no es necesario eliminarla.`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.log(`⚠️ No se pudo eliminar la tabla '${table}': ${errorMessage}`);
        // Continuamos con la siguiente tabla aunque haya error
      }
    }
    
    // Paso 2: Crear todas las tablas desde cero
    console.log("🔧 Creando todas las tablas con la estructura correcta...");
    const tablesCreated = await createAllTables();
    if (!tablesCreated) {
      console.error("❌ No se pudieron crear las tablas. Abortando.");
      Deno.exit(1);
    }
    
    // Paso 3: Crear usuario administrador
    const adminSuccess = await createAdminUser();
    if (!adminSuccess) {
      console.error("❌ No se pudo crear el usuario administrador. Abortando.");
      Deno.exit(1);
    }
    
    console.log("🎉 Configuración de la base de datos completada con éxito!");
    Deno.exit(0);
  } catch (error) {
    console.error("❌ Error inesperado durante la configuración de la base de datos:", error);
    Deno.exit(1);
  }
}

// Ejecutar la función principal
await main();