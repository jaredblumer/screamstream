import { pgTable, text, serial, integer, real, jsonb, boolean } from 'drizzle-orm/pg-core';
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
  primarySubgenre: text('primary_subgenre'),
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
  active: boolean('active').notNull().default(false),
});

export const insertContentSchema = createInsertSchema(content).omit({ id: true });
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof content.$inferSelect;

// Local interfaces used by your app code (not DB)
export interface PlatformBadge {
  platformId: number;
  platformName: string;
  imageUrl: string;
  webUrl?: string;
}
export interface ContentWithPlatforms extends Content {
  platformsBadges: PlatformBadge[];
}
