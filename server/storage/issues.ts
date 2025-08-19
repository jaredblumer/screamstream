import { db } from '@server/db';
import { issues } from '@shared/schema';
import type { Issue, InsertIssue } from '@shared/schema';

export async function createIssue(data: InsertIssue): Promise<Issue> {
  const [newIssue] = await db.insert(issues).values(data).returning();
  return newIssue;
}
