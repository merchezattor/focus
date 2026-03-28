import { and, count, desc, eq, inArray, not } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/db";
import { actions } from "@/db/schema";

export type ActionType =
	| "create"
	| "update"
	| "delete"
	| "complete"
	| "uncomplete"
	| "reviewed"
	| "groomed"
	| "processed"
	| "pending";

export type EntityType = "task" | "project" | "goal" | "milestone";

export type ActorType = "user" | "agent" | "system";

interface LogActionParams {
	entityId: string;
	entityType: EntityType;
	actorId: string;
	actorType?: ActorType;
	actionType: ActionType;
	changes?: Record<string, any>;
	metadata?: Record<string, any>;
	comment?: string;
	userId?: string; // Owner of the entity being acted upon
}

/**
 * Logs an action to the database asynchronously.
 * Uses fire-and-forget to not block the main flow.
 */
export function logAction(params: LogActionParams) {
	const {
		entityId,
		entityType,
		actorId,
		actorType,
		actionType,
		changes,
		metadata,
		comment,
		userId,
	} = params;

	const performLog = async () => {
		try {
			await getDb()
				.insert(actions)
				.values({
					id: uuidv4(),
					entityId,
					entityType,
					actorId,
					actorType,
					actionType,
					changes,
					metadata,
					comment,
					isRead: false,
					userId: userId || actorId,
				});
		} catch (error) {
			console.error("Failed to log action:", error);
		}
	};

	return performLog();
}

/**
 * Fetch actions from the database.
 * @param params Filter parameters
 */
export async function getActions(params: {
	userId: string;
	isRead?: boolean;
	entityType?: EntityType;
	entityId?: string;
	limit?: number;
	includeOwn?: boolean;
	actorType?: ActorType;
}) {
	const {
		userId,
		isRead,
		entityType,
		entityId,
		limit = 50,
		includeOwn = false,
		actorType,
	} = params;

	// Conditions — always scope by user
	const filters = [eq(actions.userId, userId)];

	// Filter by actorType if specified
	if (actorType) {
		filters.push(eq(actions.actorType, actorType));
	}

	// Exclusion logic (includeOwn defaults to false)
	if (!includeOwn) {
		const ownUserAction = and(
			eq(actions.actorId, userId),
			eq(actions.actorType, "user"),
		);
		if (ownUserAction) {
			filters.push(not(ownUserAction));
		}
	}

	if (isRead !== undefined) {
		filters.push(eq(actions.isRead, isRead));
	}
	if (entityType) {
		filters.push(eq(actions.entityType, entityType));
	}
	if (entityId) {
		filters.push(eq(actions.entityId, entityId));
	}

	const result = await getDb()
		.select()
		.from(actions)
		.where(and(...filters))
		.orderBy(desc(actions.createdAt))
		.limit(limit);

	return result;
}

export async function markActionsRead(ids: string[]) {
	if (ids.length === 0) return;

	await getDb()
		.update(actions)
		.set({ isRead: true })
		.where(inArray(actions.id, ids));
}

export async function markAllActionsRead(userId: string) {
	await getDb()
		.update(actions)
		.set({ isRead: true })
		.where(and(eq(actions.userId, userId), eq(actions.isRead, false)));
}

export async function getUnreadActionsCount(userId: string): Promise<number> {
	const ownUserAction = and(
		eq(actions.actorId, userId),
		eq(actions.actorType, "user"),
	);

	const result = await getDb()
		.select({ value: count() })
		.from(actions)
		.where(
			and(
				eq(actions.userId, userId),
				eq(actions.isRead, false),
				ownUserAction ? not(ownUserAction) : undefined,
			),
		);

	return result[0]?.value || 0;
}
