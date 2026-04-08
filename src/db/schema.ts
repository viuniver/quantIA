import { int, mysqlTable, text, varchar, decimal, timestamp } from 'drizzle-orm/mysql-core';

export const projects = mysqlTable('projects', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const takeoffs = mysqlTable('takeoffs', {
  id: int('id').primaryKey().autoincrement(),
  projectId: int('project_id').references(() => projects.id),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  quantity: decimal('quantity', { precision: 10, scale: 4 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  details: text('details'),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Takeoff = typeof takeoffs.$inferSelect;
export type NewTakeoff = typeof takeoffs.$inferInsert;
