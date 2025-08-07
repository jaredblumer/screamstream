import { db } from '@server/db';
import { apiUsage } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { ApiUsage } from '@shared/schema';

function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`; // e.g., "2025-08"
}

export async function getCurrentMonthUsage(): Promise<ApiUsage | undefined> {
  const monthKey = getCurrentMonthKey();

  const [usage] = await db.select().from(apiUsage).where(eq(apiUsage.month, monthKey));

  if (!usage) {
    const now = new Date();
    const [newUsage] = await db
      .insert(apiUsage)
      .values({
        month: monthKey,
        watchmodeRequests: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return newUsage;
  }

  return usage;
}

export async function incrementWatchmodeRequests(count = 1): Promise<void> {
  const usage = await getCurrentMonthUsage();

  if (!usage) {
    throw new Error('No current month usage found to increment Watchmode requests.');
  }

  await db
    .update(apiUsage)
    .set({
      watchmodeRequests: usage.watchmodeRequests + count,
      updatedAt: new Date(),
    })
    .where(eq(apiUsage.id, usage.id));
}
