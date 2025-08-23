import { pgTable, integer, primaryKey, index } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { content } from './content';
import { subgenres } from './subgenres';

export const contentSubgenres = pgTable(
  'content_subgenres',
  {
    contentId: integer('content_id')
      .references(() => content.id, { onDelete: 'cascade', onUpdate: 'cascade' })
      .notNull(),
    subgenreId: integer('subgenre_id')
      .references(() => subgenres.id, { onDelete: 'cascade', onUpdate: 'cascade' })
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.contentId, t.subgenreId] }),
    bySubgenre: index('idx_cs_subgenre_id').on(t.subgenreId),
  })
);

export type ContentSubgenre = InferSelectModel<typeof contentSubgenres>;
export type InsertContentSubgenre = InferInsertModel<typeof contentSubgenres>;
