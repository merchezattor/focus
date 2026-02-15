import { and, desc, eq, inArray, not } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import { actions } from "@/db/schema";

export type ActionType =
	| "create"
	| "update"
	| "delete"
	| "complete"
	| "uncomplete";

export type EntityType = "task" | "project" | "goal";

export type ActorType = "user" | "agent" | "system";

interface LogActionParams {
	entityId: string;
	entityType: EntityType;
	actorId: string;
	actorType?: ActorType;
	actionType: ActionType;
	changes?: Record<string, any>;
	metadata?: Record<string, any>;
}

/**
 * Logs an action to the database asynchronously.
 * Uses Next.js `after` if available, otherwise just triggers the promise without awaiting.
 */
export function logAction(params: LogActionParams) {
	const {
		entityId,
		entityType,
		actorId,
		actorType = "user",
		actionType,
		changes,
		metadata,
	} = params;

	const performLog = async () => {
		try {
			await db.insert(actions).values({
				id: uuidv4(),
				entityId,
				entityType,
				actorId,
				actorType,
				actionType,
				changes,
				metadata,
				isRead: false, // Default to unread
			});
		} catch (error) {
			console.error("Failed to log action:", error);
			// Fail silently to not impact main flow
		}
	};

	// Use simple fire-and-forget
	performLog();
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
	actorType?: ActorType; // New filter
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

	// Conditions
	const filters = [];

	// Filter logic:
	// 1. If actorType is specified, filter by it explicitly.
	if (actorType) {
		filters.push(eq(actions.actorType, actorType));
	}

	// 2. Exclusion logic (includeOwn defaults to false)
	// If !includeOwn, we want to hide "User's own manual actions".
	// But we DO want to see "Agent actions" done on behalf of the user.
	// So we filter out: actorId == userId AND actorType == 'user'.
	// In SQL: NOT (actor_id = userId AND actor_type = 'user')
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

	const result = await db
		.select()
		.from(actions)
		.where(and(...filters))
		.orderBy(desc(actions.createdAt))
		.limit(limit);

	return result;
}

export async function markActionsRead(ids: string[]) {
	if (ids.length === 0) return;

	await db
		.update(actions)
		.set({ isRead: true })
		.where(inArray(actions.id, ids));
}
