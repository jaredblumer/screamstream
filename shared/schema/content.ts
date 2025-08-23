import { pgTable, serial, text, integer, real, jsonb, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { subgenres } from './subgenres';

export const content = pgTable('content', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  year: integer('year').notNull(),
  averageRating: real('average_rating'),
  criticsRating: real('critics_rating'),
  usersRating: real('users_rating'),
  description: text('description').notNull(),
  posterUrl: text('poster_url').notNull(),
  primarySubgenreId: integer('primary_subgenre_id').references(() => subgenres.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  genres: jsonb('genres').$type<number[]>().default([]),
  type: text('type', { enum: ['movie', 'series'] })
    .notNull()
    .default('movie'),
  seasons: integer('seasons'),
  episodes: integer('episodes'),
  watchmodeId: integer('watchmode_id'),
  imdbId: text('imdb_id'),
  tmdbId: integer('tmdb_id'),
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

export type Content = InferSelectModel<typeof content>;
export type InsertContent = InferInsertModel<typeof content>;

export const insertContentSchema = createInsertSchema(content, {
  title: z.string().min(1),
  year: z.coerce.number().int().min(1888).max(3000),
  primarySubgenreId: z.number().int().positive().nullable().optional(),
}).omit({ id: true });

export interface PlatformBadge {
  platformId: number;
  platformName: string;
  imageUrl: string;
  webUrl?: string;
}
export interface ContentWithPlatforms extends Content {
  platformsBadges: PlatformBadge[];
}
