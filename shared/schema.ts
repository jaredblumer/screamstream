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

export const content = pgTable('content', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  year: integer('year').notNull(),
  rating: real('rating').notNull(), // Keep legacy rating field for backward compatibility
  criticsRating: real('critics_rating').notNull(),
  usersRating: real('users_rating'),
  description: text('description').notNull(),
  posterUrl: text('poster_url').notNull(),
  subgenre: text('subgenre'),
  subgenres: jsonb('subgenres').$type<string[]>().default([]),
  platforms: jsonb('platforms').$type<string[]>().notNull().default([]),
  platformLinks: jsonb('platform_links').$type<string[]>().notNull().default([]),
  type: text('type', { enum: ['movie', 'series'] })
    .notNull()
    .default('movie'),
  seasons: integer('seasons'), // Only for series
  episodes: integer('episodes'), // Only for series
  watchmodeId: integer('watchmode_id'), // For Watchmode API integration (1 credit)
  imdbId: text('imdb_id'), // For Watchmode API integration (2 credits)
  tmdbId: integer('tmdb_id'), // For Watchmode API integration (2 credits)
  backdropPath: text('backdrop_path'), // Additional backdrop image path
  originalTitle: text('original_title'), // Original title (for foreign films)
  releaseDate: text('release_date'), // Exact release date
  usRating: text('us_rating'), // Content rating (PG-13, R, etc.)
  originalLanguage: text('original_language'), // Language code
  runtimeMinutes: integer('runtime_minutes'), // Runtime in minutes
  endYear: integer('end_year'), // For series that have ended
  sourceReleaseDate: text('source_release_date'), // Date when content was added to streaming platform
  watchmodeData: jsonb('watchmode_data'), // Full Watchmode response for future use
  hidden: boolean('hidden').default(false), // Hide non-horror content from public display
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
});

export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof content.$inferSelect;

// Keep legacy movie types for backward compatibility during transition
export type InsertMovie = InsertContent;
export type Movie = Content;

// Platform enum for type safety
export const STREAMING_PLATFORMS = {
  NETFLIX: 'netflix',
  HULU: 'hulu',
  AMAZON_PRIME: 'amazon_prime',
  HBO_MAX: 'hbo_max',
  DISNEY_PLUS: 'disney_plus',
  PARAMOUNT_PLUS: 'paramount_plus',
} as const;

export type StreamingPlatform = (typeof STREAMING_PLATFORMS)[keyof typeof STREAMING_PLATFORMS];

// Session storage table.
export const sessions = pgTable(
  'sessions',
  {
    sid: varchar('sid').primaryKey(),
    sess: jsonb('sess').notNull(),
    expire: timestamp('expire').notNull(),
  },
  (table) => [index('IDX_session_expire').on(table.expire)]
);

// User storage table for local authentication
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  role: varchar('role', { length: 20 }).notNull().default('user'), // 'user', 'admin'
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

// Feedback system for user reports
export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(), // 'technical', 'data_error', 'broken_link', 'content_request', 'other'
  category: varchar('category', { length: 100 }), // More specific categorization
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  contentId: integer('content_id'), // Reference to content if applicable
  userEmail: varchar('user_email', { length: 255 }), // Optional user contact
  status: varchar('status', { length: 50 }).notNull().default('open'), // 'open', 'in_progress', 'resolved', 'closed'
  priority: varchar('priority', { length: 20 }).notNull().default('medium'), // 'low', 'medium', 'high', 'critical'
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

// Watchlist table for user-specific movie/series lists
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint to prevent duplicate watchlist entries
    index('IDX_user_content_unique').on(table.userId, table.contentId),
  ]
);

export const insertWatchlistSchema = createInsertSchema(watchlist).omit({
  id: true,
  createdAt: true,
});

export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Watchlist = typeof watchlist.$inferSelect;

// Platform images table for admin-managed streaming platform logos
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

// API Usage tracking table for monthly request limits
export const apiUsage = pgTable(
  'api_usage',
  {
    id: serial('id').primaryKey(),
    month: varchar('month', { length: 7 }).notNull().unique(), // Format: "YYYY-MM" (e.g., "2025-01")
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

// Subgenres table for managing horror subgenres
export const subgenres = pgTable(
  'subgenres',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 100 }).notNull().unique(), // URL-friendly version
    description: text('description'),
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order').default(0), // For display ordering
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
