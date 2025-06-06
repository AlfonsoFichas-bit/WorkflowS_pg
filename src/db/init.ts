import { createUser } from "./db.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

export async function initializeAdminUser() {
  try {
    const adminEmail = "admin@workflow.com";
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
