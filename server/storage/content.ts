import { db } from '@server/db';
import { eq, sql, ilike, desc, asc, and, or, inArray, gte, lt } from 'drizzle-orm';
import { getPlatformsForContentId, getPlatformsForContentIds } from './content-platforms';
import { content, platforms, contentPlatforms, contentSubgenres, subgenres } from '@shared/schema';
import type { InsertContent, Content, ContentWithPlatforms, PlatformBadge } from '@shared/schema';
import { decadeToRange } from '@server/utils/decades';

type SubgenreLite = { id: number; name: string; slug: string };

type SortField = 'average_rating' | 'critics_rating' | 'users_rating' | 'release_date';
type SortDir = 'asc' | 'desc';
type SortBy = `${SortField}:${SortDir}`;

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
    sortBy?: SortBy; // ONLY "<field>:<dir>"
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

  if (!filters?.includeHidden) {
    conditions.push(or(eq(content.hidden, false), sql`${content.hidden} IS NULL`));
  }

  if (!filters?.includeInactive) {
    conditions.push(eq(content.active, true));
  }

  const mode = filters?.platformsMode ?? 'any';

  const existsForKeyOrName = (value: string) =>
    sql`EXISTS (
      SELECT 1
      FROM ${contentPlatforms} cp
      JOIN ${platforms} p ON p.id = cp.platform_id
      WHERE cp.content_id = ${content.id}
        AND (p.platform_key = ${value} OR p.platform_name = ${value})
    )`;

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

  if (filters?.year) {
    if (typeof filters.year === 'string') {
      const r = decadeToRange(filters.year); // "1960s" -> { min: 1960, maxExclusive: 1970 }
      if (r) {
        conditions.push(gte(content.year, r.min));
        conditions.push(lt(content.year, r.maxExclusive));
      }
    } else {
      conditions.push(eq(content.year, filters.year));
    }
  }

  if (filters?.minRating !== undefined) {
    conditions.push(sql`${content.averageRating} >= ${filters.minRating}`);
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
    const q = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(content.title, q),
        ilike(content.description, q),
        sql`EXISTS (
          SELECT 1
          FROM ${contentSubgenres} cs
          JOIN ${subgenres} s ON s.id = cs.subgenre_id
          WHERE cs.content_id = ${content.id}
            AND (s.name ILIKE ${q} OR s.slug ILIKE ${q})
        )`,
        sql`EXISTS (
          SELECT 1
          FROM ${subgenres} s
          WHERE s.id = ${content.primarySubgenreId}
            AND (s.name ILIKE ${q} OR s.slug ILIKE ${q})
        )`
      )
    );
  }

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

  // ---- Sorting: ONLY "<field>:<dir>" ----
  const parseSort = (raw?: SortBy): { field: SortField; dir: SortDir } => {
    const fallback = { field: 'average_rating' as const, dir: 'desc' as const };
    if (!raw) return fallback;
    const [f, d] = (raw as string).split(':');
    const fieldOk = (
      ['average_rating', 'critics_rating', 'users_rating', 'release_date'] as const
    ).includes(f as SortField);
    const dirOk = (['asc', 'desc'] as const).includes(d as SortDir);
    if (!fieldOk || !dirOk) return fallback;
    return { field: f as SortField, dir: d as SortDir };
  };

  const { field, dir } = parseSort(filters?.sortBy);

  if (field === 'release_date') {
    const yearNullsLast = sql`${content.year} IS NULL`;
    const byYear = dir === 'asc' ? asc(content.year) : desc(content.year);
    query = query.orderBy(yearNullsLast, byYear, asc(content.title));
  } else if (field === 'critics_rating') {
    const criticsNullsLast = sql`${content.criticsRating} IS NULL`;
    const byCritics = dir === 'asc' ? asc(content.criticsRating) : desc(content.criticsRating);
    query = query.orderBy(criticsNullsLast, byCritics, asc(content.title));
  } else if (field === 'users_rating') {
    const usersNullsLast = sql`${content.usersRating} IS NULL`;
    const byUsers = dir === 'asc' ? asc(content.usersRating) : desc(content.usersRating);
    query = query.orderBy(usersNullsLast, byUsers, asc(content.title));
  } else {
    const byAvg = dir === 'asc' ? asc(content.averageRating) : desc(content.averageRating);
    query = query.orderBy(byAvg, asc(content.title));
  }

  const rows = await query;

  const contentIds = rows.map((r) => r.id);
  const platformMap = contentIds.length ? await getPlatformsForContentIds(contentIds) : new Map();

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
  const platformMap = await getPlatformsForContentIds(contentIds);

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
  const platformMap = await getPlatformsForContentIds(contentIds);

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

export async function getNewestStreaming(limit = 5): Promise<
  (Content & {
    platformsBadges: PlatformBadge[];
    primarySubgenre: SubgenreLite | null;
  })[]
> {
  const rows = await db
    .select()
    .from(content)
    .where(
      and(
        eq(content.active, true),
        or(eq(content.hidden, false), sql`${content.hidden} IS NULL`),
        sql`NULLIF(${content.sourceReleaseDate}, '') IS NOT NULL`
      )
    )
    .orderBy(sql`NULLIF(${content.sourceReleaseDate}, '')::date DESC NULLS LAST`, desc(content.id))
    .limit(limit);

  if (!rows.length) return [];

  const contentIds = rows.map((r) => r.id);
  const platformMap = await getPlatformsForContentIds(contentIds);

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
    primarySubgenre: item.primarySubgenreId ? (byId.get(item.primarySubgenreId) ?? null) : null,
  }));
}
