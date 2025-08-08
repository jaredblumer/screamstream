import { db } from '@server/db';
import { content } from '@shared/schema';
import { eq, sql, ilike, desc, asc, and, or } from 'drizzle-orm';
import { getPlatformsForContentId, getPlatformsForContentIds } from './content-platforms';
import type { InsertContent, Content, ContentWithPlatforms } from '@shared/schema';

function getDecadeYearRange(decade: string): { min: number; max: number } | null {
  switch (decade) {
    case '2020s':
      return { min: 2020, max: 2029 };
    case '2010s':
      return { min: 2010, max: 2019 };
    case '2000s':
      return { min: 2000, max: 2009 };
    case '1990s':
      return { min: 1990, max: 1999 };
    case '1980s':
      return { min: 1980, max: 1989 };
    case '1970s':
      return { min: 1970, max: 1979 };
    case '1960s':
      return { min: 1960, max: 1969 };
    default:
      return null;
  }
}

export async function getContent(filters?: {
  platform?: string;
  year?: number | string;
  minRating?: number;
  minCriticsRating?: number;
  minUsersRating?: number;
  search?: string;
  type?: 'movie' | 'series';
  subgenre?: string;
  sortBy?: 'average_rating' | 'critics_rating' | 'users_rating' | 'year_newest' | 'year_oldest';
  includeHidden?: boolean;
}): Promise<(Content & { platformsBadges: any[] })[]> {
  let query = db.select().from(content);
  const conditions = [];

  if (!filters?.includeHidden) {
    conditions.push(or(eq(content.hidden, false), sql`${content.hidden} IS NULL`));
  }

  if (filters?.platform && filters.platform !== 'all') {
    conditions.push(sql`${content.platforms} @> ${JSON.stringify([filters.platform])}`);
  }

  if (filters?.year) {
    if (typeof filters.year === 'string') {
      const range = getDecadeYearRange(filters.year);
      if (range) {
        conditions.push(
          and(sql`${content.year} >= ${range.min}`, sql`${content.year} <= ${range.max}`)
        );
      }
    } else {
      conditions.push(eq(content.year, filters.year));
    }
  }

  if (filters?.minRating !== undefined) {
    conditions.push(sql`${content.rating} >= ${filters.minRating}`);
  }

  if (filters?.minCriticsRating !== undefined) {
    conditions.push(sql`${content.criticsRating} >= ${filters.minCriticsRating}`);
  }

  if (filters?.minUsersRating !== undefined) {
    conditions.push(sql`${content.usersRating} >= ${filters.minUsersRating}`);
  }

  if (filters?.type && filters.type !== 'all') {
    conditions.push(eq(content.type, filters.type));
  }

  if (filters?.search) {
    const searchTerm = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      or(
        ilike(content.title, searchTerm),
        ilike(content.description, searchTerm),
        ilike(content.subgenre, searchTerm)
      )
    );
  }

  if (filters?.subgenre && filters.subgenre !== 'all') {
    conditions.push(
      or(
        ilike(content.subgenre, `%${filters.subgenre}%`),
        sql`${content.subgenres} @> ${JSON.stringify([filters.subgenre])}`
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  switch (filters?.sortBy) {
    case 'average_rating':
      query = query.orderBy(desc(content.averageRating));
      break;
    case 'critics_rating':
      query = query.orderBy(desc(content.criticsRating));
      break;
    case 'users_rating':
      query = query.orderBy(desc(content.usersRating));
      break;
    case 'year_newest':
      query = query.orderBy(desc(content.year));
      break;
    case 'year_oldest':
      query = query.orderBy(asc(content.year));
      break;
    default:
      query = query.orderBy(desc(content.averageRating));
      break;
  }

  const rows = await query;
  const contentIds = rows.map((item) => item.id);
  const platformMap = contentIds.length ? await getPlatformsForContentIds(contentIds) : new Map();

  return rows.map((item) => ({
    ...item,
    platformsBadges: platformMap.get(item.id) || [],
  }));
}

export async function getContentItem(id: number): Promise<ContentWithPlatforms | undefined> {
  const [item] = await db.select().from(content).where(eq(content.id, id));
  if (!item) return undefined;

  const platformsBadges = await getPlatformsForContentId(id);
  return { ...item, platformsBadges };
}

export async function createContent(data: InsertContent): Promise<Content> {
  const [newContent] = await db.insert(content).values(data).returning();
  return newContent;
}

export async function updateContent(
  id: number,
  updates: Partial<InsertContent>
): Promise<Content | undefined> {
  const [updated] = await db.update(content).set(updates).where(eq(content.id, id)).returning();
  return updated || undefined;
}

export async function deleteContent(id: number): Promise<boolean> {
  const result = await db.delete(content).where(eq(content.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}

export async function hideContent(id: number): Promise<boolean> {
  const [updated] = await db
    .update(content)
    .set({ hidden: true })
    .where(eq(content.id, id))
    .returning();
  return !!updated;
}

export async function showContent(id: number): Promise<boolean> {
  const [updated] = await db
    .update(content)
    .set({ hidden: false })
    .where(eq(content.id, id))
    .returning();
  return !!updated;
}

export async function getHiddenContent(): Promise<Content[]> {
  return await db.select().from(content).where(eq(content.hidden, true));
}
