import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

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
