import { pgTable, serial, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

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
