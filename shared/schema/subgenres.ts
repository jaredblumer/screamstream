import { pgTable, serial, text, boolean, integer } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';

export const subgenres = pgTable('subgenres', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

export type Subgenre = InferSelectModel<typeof subgenres>;
export type InsertSubgenre = InferInsertModel<typeof subgenres>;

export const insertSubgenreSchema = createInsertSchema(subgenres, {
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().max(1000).optional().nullable(),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
}).omit({ id: true });

export type InsertSubgenreInput = z.infer<typeof insertSubgenreSchema>;

export const updateSubgenreSchema = insertSubgenreSchema.partial();
export type UpdateSubgenreInput = z.infer<typeof updateSubgenreSchema>;
