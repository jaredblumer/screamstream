import {
  pgTable,
  text,
  serial,
  integer,
  real,
  jsonb,
  varchar,
  timestamp,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Content table
export const content = pgTable('content', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  year: integer('year').notNull(),
  averageRating: real('average_rating'),
  criticsRating: real('critics_rating'),
  usersRating: real('users_rating'),
  description: text('description').notNull(),
  posterUrl: text('poster_url').notNull(),
  subgenre: text('subgenre'),
  subgenres: jsonb('subgenres').$type<string[]>().default([]),
  genres: jsonb('genres').$type<number[]>().default([]),
  type: text('type', { enum: ['movie', 'series'] })
    .notNull()
    .default('movie'),
  seasons: integer('seasons'),
  episodes: integer('episodes'),
  watchmodeId: integer('watchmode_id'),
  imdbId: text('imdb_id'),
  tmdbId: integer('tmdb_id'),
  backdropPath: text('backdrop_path'),
  originalTitle: text('original_title'),
  releaseDate: text('release_date'),
  usRating: text('us_rating'),
  originalLanguage: text('original_language'),
  runtimeMinutes: integer('runtime_minutes'),
  endYear: integer('end_year'),
  sourceReleaseDate: text('source_release_date'),
  watchmodeData: jsonb('watchmode_data'),
  hidden: boolean('hidden').default(false),
});

export const insertContentSchema = createInsertSchema(content).omit({ id: true });
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof content.$inferSelect;

export interface PlatformBadge {
  platformId: number;
  platformName: string;
  imageUrl: string;
  webUrl?: string;
}

export interface ContentWithPlatforms extends Content {
  platformsBadges: PlatformBadge[];
}

// Sessions table
export const sessions = pgTable(
  'sessions',
  {
    sid: varchar('sid').primaryKey(),
    sess: jsonb('sess').notNull(),
    expire: timestamp('expire').notNull(),
  },
  (table) => [index('IDX_session_expire').on(table.expire)]
);

// Platforms table
export const platforms = pgTable(
  'platforms',
  {
    id: serial('id').primaryKey(),
    platformKey: varchar('platform_key', { length: 50 }).notNull().unique(),
    platformName: varchar('platform_name', { length: 100 }).notNull(),
    watchmodeId: integer('watchmode_id').notNull().unique(),
    imageUrl: varchar('image_url', { length: 500 }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index('idx_platforms_watchmode_id').on(table.watchmodeId)]
);

export const insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type Platform = typeof platforms.$inferSelect;

// Join table between content and platforms
export const contentPlatforms = pgTable(
  'content_platforms',
  {
    id: serial('id').primaryKey(),
    contentId: integer('content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    platformId: integer('platform_id')
      .notNull()
      .references(() => platforms.id, { onDelete: 'cascade' }),
    webUrl: varchar('web_url', { length: 500 }),
    format: varchar('format', { length: 20 }),
    seasons: integer('seasons'),
    episodes: integer('episodes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_content_platforms_content_id').on(table.contentId),
    index('idx_content_platforms_platform_id').on(table.platformId),
  ]
);

export const insertContentPlatformSchema = createInsertSchema(contentPlatforms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertContentPlatform = z.infer<typeof insertContentPlatformSchema>;
export type ContentPlatform = typeof contentPlatforms.$inferSelect;

// --- Re-added Tables ---

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  profileImageUrl: varchar('profile_image_url', { length: 500 }),
  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  firstName: true,
  lastName: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Feedback table
export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  category: varchar('category', { length: 100 }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  contentId: integer('content_id'),
  userEmail: varchar('user_email', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('open'),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'),
  submittedAt: timestamp('submitted_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
  adminNotes: text('admin_notes'),
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  submittedAt: true,
  updatedAt: true,
  resolvedAt: true,
});
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

// Watchlist table
export const watchlist = pgTable(
  'watchlist',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    contentId: integer('content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('IDX_user_content_unique').on(table.userId, table.contentId)]
);

export const insertWatchlistSchema = createInsertSchema(watchlist).omit({
  id: true,
  createdAt: true,
});

export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Watchlist = typeof watchlist.$inferSelect;

// Platform images
export const platformImages = pgTable('platform_images', {
  id: serial('id').primaryKey(),
  platformKey: varchar('platform_key', { length: 50 }).notNull().unique(), // e.g., "netflix", "hulu"
  platformName: varchar('platform_name', { length: 100 }).notNull(), // e.g., "Netflix", "Hulu"
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertPlatformImageSchema = createInsertSchema(platformImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPlatformImage = z.infer<typeof insertPlatformImageSchema>;
export type PlatformImage = typeof platformImages.$inferSelect;

// API Usage table
export const apiUsage = pgTable(
  'api_usage',
  {
    id: serial('id').primaryKey(),
    month: varchar('month', { length: 7 }).notNull().unique(),
    watchmodeRequests: integer('watchmode_requests').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index('idx_api_usage_month').on(table.month)]
);

export const insertApiUsageSchema = createInsertSchema(apiUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertApiUsage = z.infer<typeof insertApiUsageSchema>;
export type ApiUsage = typeof apiUsage.$inferSelect;

// Subgenres table
export const subgenres = pgTable(
  'subgenres',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    description: text('description'),
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_subgenres_active').on(table.isActive),
    index('idx_subgenres_sort').on(table.sortOrder),
  ]
);

export const insertSubgenreSchema = createInsertSchema(subgenres).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSubgenre = z.infer<typeof insertSubgenreSchema>;
export type Subgenre = typeof subgenres.$inferSelect;
