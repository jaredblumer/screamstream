import { db } from '@server/db';
import { feedback } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import type { Feedback, InsertFeedback } from '@shared/schema';

export async function createFeedback(data: InsertFeedback): Promise<Feedback> {
  const [newFeedback] = await db.insert(feedback).values(data).returning();
  return newFeedback;
}

export async function getFeedback(filters?: {
  status?: string;
  type?: string;
}): Promise<Feedback[]> {
  let query = db.select().from(feedback);

  if (filters?.status) {
    query = query.where(eq(feedback.status, filters.status));
  }

  if (filters?.type) {
    query = query.where(eq(feedback.type, filters.type));
  }

  return await query.orderBy(desc(feedback.submittedAt));
}

export async function updateFeedback(
  id: number,
  updates: Partial<Feedback>
): Promise<Feedback | undefined> {
  const [updated] = await db.update(feedback).set(updates).where(eq(feedback.id, id)).returning();
  return updated || undefined;
}
