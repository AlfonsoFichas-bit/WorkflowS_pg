import { createUser, getUserByEmail } from "./db.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

export async function initializeAdminUser() {
  try {
    const adminEmail = "admin@workflow.com";
    
    // Verificar si el usuario ya existe
    const existingUser = await getUserByEmail(adminEmail);
    if (existingUser && existingUser.length > 0) {
      console.log("ℹ️ El usuario administrador ya existe, no es necesario crearlo.");
      return;
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
  } catch (error) {
    console.error("❌ Error al crear usuario administrador:", error);
  }
}

// Si este archivo se ejecuta directamente, inicializar el usuario administrador
if (import.meta.main) {
  await initializeAdminUser();
}
