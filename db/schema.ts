
import { pgTable, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const priorityEnum = pgEnum('priority', ['p1', 'p2', 'p3', 'p4']);

export const projects = pgTable('projects', {
    id: text('id').primaryKey(), // using UUID string
    name: text('name').notNull(),
    color: text('color').notNull(),
    description: text('description'),
    isFavorite: boolean('is_favorite').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
    id: text('id').primaryKey(),
    content: text('content').notNull(), // maps to 'title' in app
    description: text('description'),
    completed: boolean('completed').default(false).notNull(),
    priority: text('priority').notNull(), // Storing as text to be safe, or use enum if strictly enforced
    due_date: timestamp('due_date'),
    plan_date: timestamp('plan_date'),
    project_id: text('project_id').references(() => projects.id),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const comments = pgTable('comments', {
    id: text('id').primaryKey(),
    content: text('content').notNull(),
    posted_at: timestamp('posted_at').defaultNow().notNull(),
    task_id: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
});
