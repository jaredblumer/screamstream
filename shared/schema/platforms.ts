import { pgTable, serial, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const platforms = pgTable(
  'platforms',
  {
    id: serial('id').primaryKey(),
    platformKey: varchar('platform_key', { length: 50 }).notNull().unique(),
    platformName: varchar('platform_name', { length: 100 }).notNull(),
    watchmodeId: integer('watchmode_id').notNull().unique(),
    imageUrl: varchar('image_url', { length: 500 }),
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
