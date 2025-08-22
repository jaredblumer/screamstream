import { pgTable, serial, integer, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

import { content } from './content';
import { platforms } from './platforms';

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
