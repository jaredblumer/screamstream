import { db } from '@server/db';
import { eq, sql, ilike, desc, asc, and, or, inArray } from 'drizzle-orm';
import { getPlatformsForContentId, getPlatformsForContentIds } from './content-platforms';
import { content, platforms, contentPlatforms, contentSubgenres, subgenres } from '@shared/schema';
import type { InsertContent, Content, ContentWithPlatforms, PlatformBadge } from '@shared/schema';

type SubgenreLite = { id: number; name: string; slug: string };

export async function getContentItemWithSubgenres(id: number) {
  const [row] = await db.select().from(content).where(eq(content.id, id));
  if (!row) return undefined;

  const subs = await db
    .select({
      id: subgenres.id,
      name: subgenres.name,
      slug: subgenres.slug,
    })
    .from(contentSubgenres)
    .innerJoin(subgenres, eq(contentSubgenres.subgenreId, subgenres.id))
    .where(eq(contentSubgenres.contentId, id));

  let primary: SubgenreLite | null = null;
  if (row.primarySubgenreId) {
    const match = subs.find((s) => s.id === row.primarySubgenreId);
    if (match) primary = match;
    else {
      const [p] = await db
        .select({ id: subgenres.id, name: subgenres.name, slug: subgenres.slug })
        .from(subgenres)
        .where(eq(subgenres.id, row.primarySubgenreId));
      primary = p ?? null;
    }
  }

  const platformsBadges = await getPlatformsForContentId(id);

  return {
    ...row,
    subgenres: subs as SubgenreLite[],
    primarySubgenre: primary,
    platformsBadges,
  };
}

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

export async function getContent(
  filters?: {
    platform?: string | string[];
    platformIds?: number[];
    platformsMode?: 'any' | 'all';
    year?: number | string;
    minRating?: number;
    minCriticsRating?: number;
    minUsersRating?: number;
    search?: string;
    type?: 'movie' | 'series' | 'all';
    subgenre?: string;
    sortBy?: 'average_rating' | 'critics_rating' | 'users_rating' | 'year_newest' | 'year_oldest';
    includeHidden?: boolean;
    includeInactive?: boolean;
  },
  opts: { includeSubgenres?: boolean; includePrimary?: boolean } = {}
): Promise<
  (Content & {
    platformsBadges: PlatformBadge[];
    subgenres?: SubgenreLite[];
    primarySubgenre?: SubgenreLite | null;
  })[]
> {
  let query = db.select().from(content).$dynamic();
  const conditions: any[] = [];

  // Hide by default
  if (!filters?.includeHidden) {
    conditions.push(or(eq(content.hidden, false), sql`${content.hidden} IS NULL`));
  }

  if (!filters?.includeInactive) {
    conditions.push(eq(content.active, true));
  }

  // ---- PLATFORM FILTERS (normalized schema) ----
  const mode = filters?.platformsMode ?? 'any';

  // helper: EXISTS for a single platform match by key/name
  const existsForKeyOrName = (value: string) =>
    sql`EXISTS (
      SELECT 1
      FROM ${contentPlatforms} cp
      JOIN ${platforms} p ON p.id = cp.platform_id
      WHERE cp.content_id = ${content.id}
        AND (p.platform_key = ${value} OR p.platform_name = ${value})
    )`;

  // helper: EXISTS for a single platform match by id
  const existsForId = (id: number) =>
    sql`EXISTS (
      SELECT 1
      FROM ${contentPlatforms} cp
      WHERE cp.content_id = ${content.id}
        AND cp.platform_id = ${id}
    )`;

  if (filters?.platformIds && filters.platformIds.length > 0) {
    const idConds = filters.platformIds.map((id) => existsForId(id));
    conditions.push(mode === 'all' ? and(...idConds) : or(...idConds));
  } else if (filters?.platform && filters.platform !== 'all') {
    const values = Array.isArray(filters.platform) ? filters.platform : [filters.platform];
    const keyConds = values.map((v) => existsForKeyOrName(v));
    conditions.push(mode === 'all' ? and(...keyConds) : or(...keyConds));
  }

  // Year or decade
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

  // Ratings
  if (filters?.minRating !== undefined) {
    conditions.push(sql`${content.averageRating} >= ${filters.minRating}`);
  }
  if (filters?.minCriticsRating !== undefined) {
    conditions.push(sql`${content.criticsRating} >= ${filters.minCriticsRating}`);
  }
  if (filters?.minUsersRating !== undefined) {
    conditions.push(sql`${content.usersRating} >= ${filters.minUsersRating}`);
  }

  // Type
  if (filters?.type && filters.type !== 'all') {
    conditions.push(eq(content.type, filters.type));
  }

  // Search
  if (filters?.search) {
    const q = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(content.title, q),
        ilike(content.description, q),
        // any associated subgenre name matches
        sql`EXISTS (
          SELECT 1
          FROM ${contentSubgenres} cs
          JOIN ${subgenres} s ON s.id = cs.subgenre_id
          WHERE cs.content_id = ${content.id}
            AND (s.name ILIKE ${q} OR s.slug ILIKE ${q})
        )`,
        // primary subgenre name matches (extra safety)
        sql`EXISTS (
          SELECT 1
          FROM ${subgenres} s
          WHERE s.id = ${content.primarySubgenreId}
            AND (s.name ILIKE ${q} OR s.slug ILIKE ${q})
        )`
      )
    );
  }

  // Subgenre filter
  if (filters?.subgenre && filters.subgenre !== 'all') {
    const val = filters.subgenre;
    conditions.push(sql`
      EXISTS (
        SELECT 1
        FROM ${subgenres} s
        WHERE (s.slug = ${val} OR s.name ILIKE ${'%' + val + '%'})
          AND (
            s.id = ${content.primarySubgenreId}
            OR EXISTS (
              SELECT 1 FROM ${contentSubgenres} cs
              WHERE cs.content_id = ${content.id} AND cs.subgenre_id = s.id
            )
          )
      )
    `);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // Sorting
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

  // Platforms
  const contentIds = rows.map((r) => r.id);
  const platformMap = contentIds.length ? await getPlatformsForContentIds(contentIds) : new Map();

  // Optional: subgenres
  let subsMap = new Map<number, SubgenreLite[]>();
  if (opts.includeSubgenres && contentIds.length) {
    const subs = await db
      .select({
        contentId: contentSubgenres.contentId,
        id: subgenres.id,
        name: subgenres.name,
        slug: subgenres.slug,
      })
      .from(contentSubgenres)
      .innerJoin(subgenres, eq(contentSubgenres.subgenreId, subgenres.id))
      .where(inArray(contentSubgenres.contentId, contentIds));

    for (const r of subs) {
      const arr = subsMap.get(r.contentId) ?? [];
      arr.push({ id: r.id, name: r.name, slug: r.slug });
      subsMap.set(r.contentId, arr);
    }
  }

  // Optional: primary subgenre
  let primaryMap = new Map<number, SubgenreLite | null>();
  if (opts.includePrimary && rows.length) {
    const primaryIds = Array.from(
      new Set(rows.map((r) => r.primarySubgenreId).filter((x): x is number => x != null))
    );
    const byId = new Map<number, SubgenreLite>();
    if (primaryIds.length) {
      const primaries = await db
        .select({ id: subgenres.id, name: subgenres.name, slug: subgenres.slug })
        .from(subgenres)
        .where(inArray(subgenres.id, primaryIds));
      for (const p of primaries) byId.set(p.id, p);
    }
    for (const r of rows) {
      primaryMap.set(r.id, r.primarySubgenreId ? (byId.get(r.primarySubgenreId) ?? null) : null);
    }
  }

  return rows.map((item) => ({
    ...item,
    platformsBadges: platformMap.get(item.id) || [],
    ...(opts.includeSubgenres ? { subgenres: subsMap.get(item.id) || [] } : {}),
    ...(opts.includePrimary ? { primarySubgenre: primaryMap.get(item.id) ?? null } : {}),
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

// Returns HIDDEN content + subgenres + primary + platforms
export async function getHiddenContent(): Promise<
  (Content & {
    platformsBadges: PlatformBadge[];
    subgenres: SubgenreLite[];
    primarySubgenre: SubgenreLite | null;
  })[]
> {
  const rows = await db.select().from(content).where(eq(content.hidden, true));
  if (!rows.length) return [];

  const contentIds = rows.map((r) => r.id);

  // platforms
  const platformMap = await getPlatformsForContentIds(contentIds);

  // attached subgenres
  const subs = await db
    .select({
      contentId: contentSubgenres.contentId,
      id: subgenres.id,
      name: subgenres.name,
      slug: subgenres.slug,
    })
    .from(contentSubgenres)
    .innerJoin(subgenres, eq(contentSubgenres.subgenreId, subgenres.id))
    .where(inArray(contentSubgenres.contentId, contentIds));

  const subsMap = new Map<number, SubgenreLite[]>();
  for (const r of subs) {
    const arr = subsMap.get(r.contentId) ?? [];
    arr.push({ id: r.id, name: r.name, slug: r.slug });
    subsMap.set(r.contentId, arr);
  }

  // primary subgenres
  const primaryIds = Array.from(
    new Set(rows.map((r) => r.primarySubgenreId).filter((x): x is number => x != null))
  );
  const byId = new Map<number, SubgenreLite>();
  if (primaryIds.length) {
    const primaries = await db
      .select({ id: subgenres.id, name: subgenres.name, slug: subgenres.slug })
      .from(subgenres)
      .where(inArray(subgenres.id, primaryIds));
    for (const p of primaries) byId.set(p.id, p);
  }

  return rows.map((item) => ({
    ...item,
    platformsBadges: platformMap.get(item.id) || [],
    subgenres: subsMap.get(item.id) || [],
    primarySubgenre: item.primarySubgenreId ? (byId.get(item.primarySubgenreId) ?? null) : null,
  }));
}

// Returns INACTIVE (but not hidden) content + subgenres + primary + platforms
export async function getInactiveContent(): Promise<
  (Content & {
    platformsBadges: PlatformBadge[];
    subgenres: SubgenreLite[];
    primarySubgenre: SubgenreLite | null;
  })[]
> {
  const rows = await db
    .select()
    .from(content)
    .where(and(eq(content.active, false), eq(content.hidden, false)));

  if (!rows.length) return [];

  const contentIds = rows.map((r) => r.id);

  // platforms
  const platformMap = await getPlatformsForContentIds(contentIds);

  // attached subgenres
  const subs = await db
    .select({
      contentId: contentSubgenres.contentId,
      id: subgenres.id,
      name: subgenres.name,
      slug: subgenres.slug,
    })
    .from(contentSubgenres)
    .innerJoin(subgenres, eq(contentSubgenres.subgenreId, subgenres.id))
    .where(inArray(contentSubgenres.contentId, contentIds));

  const subsMap = new Map<number, SubgenreLite[]>();
  for (const r of subs) {
    const arr = subsMap.get(r.contentId) ?? [];
    arr.push({ id: r.id, name: r.name, slug: r.slug });
    subsMap.set(r.contentId, arr);
  }

  // primary subgenres
  const primaryIds = Array.from(
    new Set(rows.map((r) => r.primarySubgenreId).filter((x): x is number => x != null))
  );
  const byId = new Map<number, SubgenreLite>();
  if (primaryIds.length) {
    const primaries = await db
      .select({ id: subgenres.id, name: subgenres.name, slug: subgenres.slug })
      .from(subgenres)
      .where(inArray(subgenres.id, primaryIds));
    for (const p of primaries) byId.set(p.id, p);
  }

  return rows.map((item) => ({
    ...item,
    platformsBadges: platformMap.get(item.id) || [],
    subgenres: subsMap.get(item.id) || [],
    primarySubgenre: item.primarySubgenreId ? (byId.get(item.primarySubgenreId) ?? null) : null,
  }));
}
