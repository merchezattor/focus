import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

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
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
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

// --- Enums ---

export const priorityEnum = pgEnum("priority", ["p1", "p2", "p3", "p4"]);

export const taskStatusEnum = pgEnum("task_status", [
	"todo",
	"in_progress",
	"review",
	"done",
	"cold",
]);

export const projectStatusEnum = pgEnum("project_status", [
	"working",
	"archived",
	"complete",
	"frozen",
]);

export const actionTypeEnum = pgEnum("action_type", [
	"create",
	"update",
	"delete",
	"complete",
	"uncomplete",
	"reviewed",
	"groomed",
	"processed",
	"pending",
]);

export const entityTypeEnum = pgEnum("entity_type", [
	"task",
	"project",
	"goal",
]);

export const actorTypeEnum = pgEnum("actor_type", ["user", "agent", "system"]);

// --- Core Entities ---

export const goals = pgTable(
	"goals",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		description: text("description"),
		priority: priorityEnum("priority").notNull(),
		due_date: timestamp("due_date"),
		color: text("color").notNull(),
		userId: text("user_id").references(() => user.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [index("goals_user_id_idx").on(table.userId)],
);

export const projects = pgTable(
	"projects",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		color: text("color").notNull(),
		priority: priorityEnum("priority").notNull().default("p4"),
		description: text("description"),
		isFavorite: boolean("is_favorite").default(false).notNull(),
		status: projectStatusEnum("status").default("working").notNull(),
		goalId: text("goal_id").references(() => goals.id, {
			onDelete: "set null",
		}),
		parentProjectId: text("parent_project_id"),
		view_type: text("view_type").default("list").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		userId: text("user_id").references(() => user.id),
	},
	(table) => [index("projects_user_id_idx").on(table.userId)],
);

export const tasks = pgTable(
	"tasks",
	{
		id: text("id").primaryKey(),
		title: text("title").notNull(),
		description: text("description"),
		status: taskStatusEnum("status").default("todo").notNull(),
		priority: priorityEnum("priority").notNull(),
		due_date: timestamp("due_date"),
		plan_date: timestamp("plan_date"),
		project_id: text("project_id").references(() => projects.id, {
			onDelete: "cascade",
		}),
		userId: text("user_id").references(() => user.id),
		created_at: timestamp("created_at").defaultNow().notNull(),
		updated_at: timestamp("updated_at").defaultNow().notNull(),
		parent_id: text("parent_id").references((): any => tasks.id, {
			onDelete: "cascade",
		}),
		order_num: integer("order_num").default(0).notNull(),
	},
	(table) => [
		index("tasks_user_id_project_id_idx").on(table.userId, table.project_id),
		index("tasks_user_id_priority_created_at_idx").on(
			table.userId,
			table.priority,
			table.created_at,
		),
		index("tasks_user_id_due_date_idx").on(table.userId, table.due_date),
		index("tasks_user_id_status_idx").on(table.userId, table.status),
	],
);

export const comments = pgTable(
	"comments",
	{
		id: text("id").primaryKey(),
		content: text("content").notNull(),
		posted_at: timestamp("posted_at").defaultNow().notNull(),
		task_id: text("task_id")
			.references(() => tasks.id, { onDelete: "cascade" })
			.notNull(),
		userId: text("user_id").references(() => user.id),
		actorType: actorTypeEnum("actor_type").default("user"),
	},
	(table) => [index("comments_task_id_idx").on(table.task_id)],
);

export const apiTokens = pgTable("api_tokens", {
	id: text("id").primaryKey(),
	token: text("token").notNull().unique(),
	userId: text("user_id")
		.references(() => user.id, { onDelete: "cascade" })
		.notNull(),
	name: text("name").notNull().default("Default Token"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Activity Log ---

export const actions = pgTable(
	"actions",
	{
		id: text("id").primaryKey(),
		entityId: text("entity_id").notNull(),
		entityType: entityTypeEnum("entity_type").notNull(),

		actorId: text("actor_id").notNull(),
		actorType: actorTypeEnum("actor_type").notNull().default("user"),

		actionType: actionTypeEnum("action_type").notNull(),

		// JSON object storing NEW values only: { "title": "New Title" }
		changes: jsonb("changes"),

		// Metadata for pure "events"
		metadata: jsonb("metadata"),

		// Optional comment for agentic actions
		comment: text("comment"),

		createdAt: timestamp("created_at").defaultNow().notNull(),

		// Single isRead field.
		// - If Actor=User, this tracks if Agent has read it.
		// - If Actor=Agent, this tracks if User has read it.
		isRead: boolean("is_read").default(false).notNull(),

		// Owner of the entity being acted upon (for user-scoped queries)
		userId: text("user_id").references(() => user.id),
	},
	(table) => [
		index("actions_entity_id_entity_type_created_at_idx").on(
			table.entityId,
			table.entityType,
			table.createdAt,
		),
		index("actions_user_id_is_read_created_at_idx").on(
			table.userId,
			table.isRead,
			table.createdAt,
		),
	],
);
