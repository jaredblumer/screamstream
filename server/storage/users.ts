import { db } from '@server/db';
import { users } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { User, InsertUser } from '@shared/schema';

export async function getUser(id: number): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user || undefined;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  return user || undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user || undefined;
}

export async function createUser(userData: InsertUser): Promise<User> {
  const [newUser] = await db.insert(users).values(userData).returning();
  return newUser;
}

export async function updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
  const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
  return updated || undefined;
}

export async function setPasswordResetToken(
  userId: number,
  token: string,
  expiry: Date
): Promise<void> {
  await db
    .update(users)
    .set({
      resetToken: token,
      resetTokenExpiry: expiry,
    })
    .where(eq(users.id, userId));
}

export async function getUserByResetToken(token: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.resetToken, token), sql`${users.resetTokenExpiry} > NOW()`));
  return user || undefined;
}

export async function clearPasswordResetToken(userId: number): Promise<void> {
  await db
    .update(users)
    .set({
      resetToken: null,
      resetTokenExpiry: null,
    })
    .where(eq(users.id, userId));
}
