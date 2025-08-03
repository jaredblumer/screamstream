import {
  content,
  users,
  feedback,
  watchlist,
  platformImages,
  apiUsage,
  subgenres,
  type Content,
  type InsertContent,
  type Movie,
  type InsertMovie,
  type User,
  type InsertUser,
  type Feedback,
  type InsertFeedback,
  type Watchlist,
  type InsertWatchlist,
  type PlatformImage,
  type InsertPlatformImage,
  type ApiUsage,
  type InsertApiUsage,
  type Subgenre,
  type InsertSubgenre,
} from '@shared/schema';
import { db } from './db';
import { eq, and, or, ilike, desc, asc, sql } from 'drizzle-orm';

export interface IStorage {
  getContent(filters?: {
    platform?: string;
    year?: number | string;
    minRating?: number;
    minCriticsRating?: number;
    minUsersRating?: number;
    search?: string;
    type?: 'movie' | 'series';
    subgenre?: string;
    sortBy?: 'rating' | 'critics_rating' | 'users_rating' | 'year_newest' | 'year_oldest';
    includeHidden?: boolean; // Admin only - include hidden content
  }): Promise<Content[]>;
  getContentItem(id: number): Promise<Content | undefined>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: number, content: Partial<InsertContent>): Promise<Content | undefined>;
  deleteContent(id: number): Promise<boolean>;

  // Content visibility management (admin only)
  hideContent(id: number): Promise<boolean>;
  showContent(id: number): Promise<boolean>;
  getHiddenContent(): Promise<Content[]>;

  // User operations for local authentication
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Password reset operations
  setPasswordResetToken(userId: number, token: string, expiry: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  clearPasswordResetToken(userId: number): Promise<void>;

  // Feedback operations
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedback(filters?: { status?: string; type?: string }): Promise<Feedback[]>;
  updateFeedback(id: number, updates: Partial<Feedback>): Promise<Feedback | undefined>;

  // Watchlist operations
  getUserWatchlist(userId: number): Promise<Content[]>;
  addToWatchlist(userId: number, contentId: number): Promise<boolean>;
  removeFromWatchlist(userId: number, contentId: number): Promise<boolean>;
  isInWatchlist(userId: number, contentId: number): Promise<boolean>;

  // Legacy movie methods for backward compatibility
  getMovies(filters?: {
    platform?: string;
    year?: number | string;
    minRating?: number;
    search?: string;
    sortBy?: 'rating' | 'critics_rating' | 'users_rating' | 'year_newest' | 'year_oldest';
  }): Promise<Movie[]>;
  getMovie(id: number): Promise<Movie | undefined>;
  createMovie(movie: InsertMovie): Promise<Movie>;
  updateMovie(id: number, movie: Partial<InsertMovie>): Promise<Movie | undefined>;
  deleteMovie(id: number): Promise<boolean>;

  // Platform image management
  getPlatformImages(): Promise<PlatformImage[]>;
  getPlatformImage(platformKey: string): Promise<PlatformImage | undefined>;
  createPlatformImage(platformImage: InsertPlatformImage): Promise<PlatformImage>;
  updatePlatformImage(
    id: number,
    updates: Partial<InsertPlatformImage>
  ): Promise<PlatformImage | undefined>;
  deletePlatformImage(id: number): Promise<boolean>;

  // API Usage tracking
  getCurrentMonthUsage(): Promise<ApiUsage | undefined>;
  incrementWatchmodeRequests(count?: number): Promise<void>;
  incrementTvdbRequests(count?: number): Promise<void>;
  resetMonthlyUsage(): Promise<void>;

  // Subgenres management
  getSubgenres(activeOnly?: boolean): Promise<Subgenre[]>;
  getSubgenre(id: number): Promise<Subgenre | undefined>;
  getSubgenreBySlug(slug: string): Promise<Subgenre | undefined>;
  createSubgenre(subgenre: InsertSubgenre): Promise<Subgenre>;
  updateSubgenre(id: number, updates: Partial<InsertSubgenre>): Promise<Subgenre | undefined>;
  deleteSubgenre(id: number): Promise<boolean>;
  reorderSubgenres(orderedIds: number[]): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Helper function to convert decade string to year range
  private getDecadeYearRange(decade: string): { min: number; max: number } | null {
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

  async getContent(filters?: {
    platform?: string;
    year?: number | string;
    minRating?: number;
    minCriticsRating?: number;
    minUsersRating?: number;
    search?: string;
    type?: 'movie' | 'series';
    subgenre?: string;
    sortBy?: 'rating' | 'critics_rating' | 'users_rating' | 'year_newest' | 'year_oldest';
    includeHidden?: boolean;
  }): Promise<Content[]> {
    let query = db.select().from(content);

    // Build conditions array
    const conditions = [];

    // Admin only - filter hidden content unless explicitly included
    if (!filters?.includeHidden) {
      conditions.push(or(eq(content.hidden, false), sql`${content.hidden} IS NULL`));
    }

    // Platform filter
    if (filters?.platform && filters.platform !== 'all') {
      conditions.push(sql`${content.platforms} @> ${JSON.stringify([filters.platform])}`);
    }

    // Year filter (including decade ranges)
    if (filters?.year) {
      if (typeof filters.year === 'string') {
        const decadeRange = this.getDecadeYearRange(filters.year);
        if (decadeRange) {
          conditions.push(
            and(
              sql`${content.year} >= ${decadeRange.min}`,
              sql`${content.year} <= ${decadeRange.max}`
            )
          );
        }
      } else {
        conditions.push(eq(content.year, filters.year));
      }
    }

    // Rating filters
    if (filters?.minRating !== undefined) {
      conditions.push(sql`${content.rating} >= ${filters.minRating}`);
    }

    if (filters?.minCriticsRating !== undefined) {
      conditions.push(sql`${content.criticsRating} >= ${filters.minCriticsRating}`);
    }

    if (filters?.minUsersRating !== undefined) {
      conditions.push(sql`${content.usersRating} >= ${filters.minUsersRating}`);
    }

    // Type filter
    if (filters?.type && filters.type !== 'all') {
      conditions.push(eq(content.type, filters.type));
    }

    // Search filter
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

    // Subgenre filter
    if (filters?.subgenre && filters.subgenre !== 'all') {
      conditions.push(
        or(
          ilike(content.subgenre, `%${filters.subgenre}%`),
          sql`${content.subgenres} @> ${JSON.stringify([filters.subgenre])}`
        )
      );
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    switch (filters?.sortBy) {
      case 'rating':
        query = query.orderBy(desc(content.rating));
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
        query = query.orderBy(desc(content.rating));
        break;
    }

    return await query;
  }

  async getContentItem(id: number): Promise<Content | undefined> {
    const [result] = await db.select().from(content).where(eq(content.id, id));
    return result || undefined;
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const [newContent] = await db.insert(content).values(insertContent).returning();
    return newContent;
  }

  async updateContent(
    id: number,
    updateData: Partial<InsertContent>
  ): Promise<Content | undefined> {
    const [updated] = await db
      .update(content)
      .set(updateData)
      .where(eq(content.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteContent(id: number): Promise<boolean> {
    const result = await db.delete(content).where(eq(content.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async hideContent(id: number): Promise<boolean> {
    const [updated] = await db
      .update(content)
      .set({ hidden: true })
      .where(eq(content.id, id))
      .returning();
    return !!updated;
  }

  async showContent(id: number): Promise<boolean> {
    const [updated] = await db
      .update(content)
      .set({ hidden: false })
      .where(eq(content.id, id))
      .returning();
    return !!updated;
  }

  async getHiddenContent(): Promise<Content[]> {
    return await db.select().from(content).where(eq(content.hidden, true));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated || undefined;
  }

  async setPasswordResetToken(userId: number, token: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({
        resetToken: token,
        resetTokenExpiry: expiry,
      })
      .where(eq(users.id, userId));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.resetToken, token), sql`${users.resetTokenExpiry} > NOW()`));
    return user || undefined;
  }

  async clearPasswordResetToken(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        resetToken: null,
        resetTokenExpiry: null,
      })
      .where(eq(users.id, userId));
  }

  // Legacy movie methods for backward compatibility
  async getMovies(filters?: {
    platform?: string;
    year?: number | string;
    minRating?: number;
    search?: string;
    sortBy?: 'rating' | 'critics_rating' | 'users_rating' | 'year_newest' | 'year_oldest';
  }): Promise<Movie[]> {
    const allContent = await this.getContent({
      ...filters,
      type: 'movie',
    });
    return allContent as Movie[];
  }

  async getMovie(id: number): Promise<Movie | undefined> {
    const contentItem = await this.getContentItem(id);
    return contentItem && contentItem.type === 'movie' ? (contentItem as Movie) : undefined;
  }

  async createMovie(insertMovie: InsertMovie): Promise<Movie> {
    return (await this.createContent(insertMovie)) as Movie;
  }

  async updateMovie(id: number, updateData: Partial<InsertMovie>): Promise<Movie | undefined> {
    const updated = await this.updateContent(id, updateData);
    return updated && updated.type === 'movie' ? (updated as Movie) : undefined;
  }

  async deleteMovie(id: number): Promise<boolean> {
    return await this.deleteContent(id);
  }

  // Feedback operations
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db.insert(feedback).values(feedbackData).returning();
    return newFeedback;
  }

  async getFeedback(filters?: { status?: string; type?: string }): Promise<Feedback[]> {
    let query = db.select().from(feedback);

    if (filters?.status) {
      query = query.where(eq(feedback.status, filters.status));
    }

    if (filters?.type) {
      query = query.where(eq(feedback.type, filters.type));
    }

    return await query.orderBy(desc(feedback.submittedAt));
  }

  async updateFeedback(id: number, updates: Partial<Feedback>): Promise<Feedback | undefined> {
    const [updated] = await db.update(feedback).set(updates).where(eq(feedback.id, id)).returning();
    return updated || undefined;
  }

  // Watchlist operations
  async getUserWatchlist(userId: number): Promise<Content[]> {
    const watchlistItems = await db
      .select({
        content: content,
      })
      .from(watchlist)
      .innerJoin(content, eq(watchlist.contentId, content.id))
      .where(eq(watchlist.userId, userId));

    return watchlistItems.map((item) => item.content);
  }

  async addToWatchlist(userId: number, contentId: number): Promise<boolean> {
    try {
      await db.insert(watchlist).values({
        userId,
        contentId,
      });
      return true;
    } catch (error) {
      // Handle duplicate entries or other errors
      console.error('Error adding to watchlist:', error);
      return false;
    }
  }

  async removeFromWatchlist(userId: number, contentId: number): Promise<boolean> {
    const result = await db
      .delete(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.contentId, contentId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async isInWatchlist(userId: number, contentId: number): Promise<boolean> {
    const [result] = await db
      .select()
      .from(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.contentId, contentId)));
    return !!result;
  }

  // Platform image management
  async getPlatformImages(): Promise<PlatformImage[]> {
    return await db.select().from(platformImages).orderBy(platformImages.platformName);
  }

  async getPlatformImage(platformKey: string): Promise<PlatformImage | undefined> {
    const [image] = await db
      .select()
      .from(platformImages)
      .where(eq(platformImages.platformKey, platformKey));
    return image || undefined;
  }

  async createPlatformImage(platformImage: InsertPlatformImage): Promise<PlatformImage> {
    const [newImage] = await db.insert(platformImages).values(platformImage).returning();
    return newImage;
  }

  async updatePlatformImage(
    id: number,
    updates: Partial<InsertPlatformImage>
  ): Promise<PlatformImage | undefined> {
    const [updated] = await db
      .update(platformImages)
      .set(updates)
      .where(eq(platformImages.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePlatformImage(id: number): Promise<boolean> {
    const result = await db.delete(platformImages).where(eq(platformImages.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // API Usage tracking
  async getCurrentMonthUsage(): Promise<ApiUsage | undefined> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [usage] = await db
      .select()
      .from(apiUsage)
      .where(and(eq(apiUsage.month, currentMonth), eq(apiUsage.year, currentYear)));

    if (!usage) {
      // Create new usage record for current month
      const [newUsage] = await db
        .insert(apiUsage)
        .values({
          month: currentMonth,
          year: currentYear,
          watchmodeRequests: 0,
          tvdbRequests: 0,
          lastReset: now,
        })
        .returning();
      return newUsage;
    }

    return usage;
  }

  async incrementWatchmodeRequests(count: number = 1): Promise<void> {
    const usage = await this.getCurrentMonthUsage();
    if (usage) {
      await db
        .update(apiUsage)
        .set({
          watchmodeRequests: usage.watchmodeRequests + count,
          updatedAt: new Date(),
        })
        .where(eq(apiUsage.id, usage.id));
    }
  }

  async incrementTvdbRequests(count: number = 1): Promise<void> {
    const usage = await this.getCurrentMonthUsage();
    if (usage) {
      await db
        .update(apiUsage)
        .set({
          tvdbRequests: usage.tvdbRequests + count,
          updatedAt: new Date(),
        })
        .where(eq(apiUsage.id, usage.id));
    }
  }

  async resetMonthlyUsage(): Promise<void> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    await db
      .insert(apiUsage)
      .values({
        month: currentMonth,
        year: currentYear,
        watchmodeRequests: 0,
        tvdbRequests: 0,
        lastReset: now,
      })
      .onConflictDoUpdate({
        target: [apiUsage.month, apiUsage.year],
        set: {
          watchmodeRequests: 0,
          tvdbRequests: 0,
          lastReset: now,
          updatedAt: now,
        },
      });
  }

  // Subgenres management
  async getSubgenres(activeOnly: boolean = false): Promise<Subgenre[]> {
    let query = db.select().from(subgenres);

    if (activeOnly) {
      query = query.where(eq(subgenres.isActive, true));
    }

    return await query.orderBy(subgenres.sortOrder, subgenres.name);
  }

  async getSubgenre(id: number): Promise<Subgenre | undefined> {
    const [subgenre] = await db.select().from(subgenres).where(eq(subgenres.id, id));
    return subgenre || undefined;
  }

  async getSubgenreBySlug(slug: string): Promise<Subgenre | undefined> {
    const [subgenre] = await db.select().from(subgenres).where(eq(subgenres.slug, slug));
    return subgenre || undefined;
  }

  async createSubgenre(subgenreData: InsertSubgenre): Promise<Subgenre> {
    const [newSubgenre] = await db.insert(subgenres).values(subgenreData).returning();
    return newSubgenre;
  }

  async updateSubgenre(
    id: number,
    updates: Partial<InsertSubgenre>
  ): Promise<Subgenre | undefined> {
    const [updated] = await db
      .update(subgenres)
      .set(updates)
      .where(eq(subgenres.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSubgenre(id: number): Promise<boolean> {
    const result = await db.delete(subgenres).where(eq(subgenres.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async reorderSubgenres(orderedIds: number[]): Promise<boolean> {
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await db
          .update(subgenres)
          .set({ sortOrder: i + 1 })
          .where(eq(subgenres.id, orderedIds[i]));
      }
      return true;
    } catch (error) {
      console.error('Error reordering subgenres:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
