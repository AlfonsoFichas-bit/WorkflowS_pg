import { db } from "./db.ts";
import { users } from "./schema.ts";
import { eq } from "drizzle-orm";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// User services
export async function getUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0];
}

export async function getUserById(id: number) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0];
}

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const { name, email, password, role } = userData;
  
  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("User with this email already exists");
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password);
  
  // Create user
  const result = await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  
  return result[0];
}

export async function verifyPassword(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }
  
  return user;
}

export async function getAllUsers() {
  return await db.select().from(users);
}