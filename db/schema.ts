
import { pgTable, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';


export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
});

export const priorityEnum = pgEnum('priority', ['p1', 'p2', 'p3', 'p4']);

export const goals = pgTable('goals', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    priority: text('priority').notNull(),
    due_date: timestamp('due_date'),
    color: text('color').notNull(), // Goals should have color too? User didn't specify but it's good for UI. Or maybe not? User said "displayed same way as projects list". Projects have color. So assume yes.
    userId: text('user_id').references(() => user.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
    id: text('id').primaryKey(), // using UUID string
    name: text('name').notNull(),
    color: text('color').notNull(),
    description: text('description'),
    isFavorite: boolean('is_favorite').default(false).notNull(),
    goal_id: text('goal_id').references(() => goals.id), // Link project to goal
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    userId: text('user_id').references(() => user.id), // Link project to user (nullable for migration)
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
    userId: text('user_id').references(() => user.id), // Link task to user (nullable for migration)
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const comments = pgTable('comments', {
    id: text('id').primaryKey(),
    content: text('content').notNull(),
    posted_at: timestamp('posted_at').defaultNow().notNull(),
    task_id: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
});

export const apiTokens = pgTable('api_tokens', {
    id: text('id').primaryKey(),
    token: text('token').notNull().unique(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
