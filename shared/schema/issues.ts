import { pgTable, serial, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const issues = pgTable('issues', {
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

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  submittedAt: true,
  updatedAt: true,
  resolvedAt: true,
});
export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Issue = typeof issues.$inferSelect;
