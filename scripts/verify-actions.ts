import { eq } from "drizzle-orm";
import { db } from "@/db";
import { actions, user } from "@/db/schema";
import { getActions, markActionsRead } from "@/lib/actions";
import { createTask, deleteTask, updateTask } from "@/lib/storage";

async function verify() {
	console.log("Starting Actions Verification...");

	const userId = `verify-user-${Date.now()}`;
	const taskId = `verify-task-${Date.now()}`;
	// 0. Create User
	console.log("0. Creating User...");
	await db.insert(user).values({
		id: userId,
		name: "Verify User",
		email: `verify-${Date.now()}@example.com`,
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	// 1. Create Task
	console.log("1. Creating Task...");
	await createTask(
		{
			id: taskId,
			title: "Verification Task",
			completed: false,
			status: "todo",
			priority: "p1",
			projectId: null,
			dueDate: null,
			planDate: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			comments: [],
		},
		userId,
	);

	// Give async logging a moment
	await new Promise((r) => setTimeout(r, 1000));

	let logs = await getActions({ userId: "other-user", limit: 10 }); // Viewing as "other" user to see "verify-user" actions
	const createLog = logs.find(
		(l) => l.entityId === taskId && l.actionType === "create",
	);

	if (createLog) {
		console.log("✅ Create action logged:", createLog.id);
	} else {
		console.error("❌ Create action NOT found!");
	}

	// 2. Update Task
	console.log("2. Updating Task...");
	await updateTask(taskId, { title: "Updated Title" }, userId);

	await new Promise((r) => setTimeout(r, 1000));

	logs = await getActions({ userId: "other-user", limit: 10 });
	const updateLog = logs.find(
		(l) => l.entityId === taskId && l.actionType === "update",
	);

	if (updateLog) {
		console.log("✅ Update action logged:", updateLog.id);
		console.log("   Changes:", updateLog.changes);
	} else {
		console.error("❌ Update action NOT found!");
	}

	// 2b. Update Task (simulate Agent)
	console.log("2b. Updating Task (as Agent)...");
	await updateTask(
		taskId,
		{
			title: "Updated Title by Agent",
		},
		userId,
		"agent",
	);

	await new Promise((r) => setTimeout(r, 1000));

	const agentLogs = await getActions({
		userId: userId,
		limit: 10,
		includeOwn: true,
	}); // Agent action should appear even for own user if includeOwn is true, or strictly check actorType
	// Actually getActions filters out own actions by default.
	// If actorType is agent, it is NOT "own" action (actorId is userId, but actorType is different? No, actorId is userId).
	// Let's check getActions logic: ne(actions.actorId, userId).
	// If I pass actorId=userId for agent action, it will be filtered out by default getActions.
	// But the Events page now uses includeOwn: true.
	// Let's verify we can find it with includeOwn: true.

	const agentLog = agentLogs.find(
		(l) =>
			l.entityId === taskId &&
			l.actionType === "update" &&
			l.actorType === "agent",
	);

	if (agentLog) {
		console.log("✅ Agent Update action logged:", agentLog.id);
		console.log("   Actor Type:", agentLog.actorType);
	} else {
		console.error(
			"❌ Agent Update action NOT found (check actorType or filtering)!",
		);
	}

	// 3. Mark as Read
	if (createLog) {
		console.log("3. Marking as Read...");
		await markActionsRead([createLog.id]);

		// getActions filers by criteria. If we request isRead=true, we should find it.
		// But wait, getActions excludes own actions. verify-user created it. other-user reads it.

		// We need to check the DB directly to be sure about the flag
		const record = await db
			.select()
			.from(actions)
			.where(eq(actions.id, createLog.id));
		if (record[0].isRead === true) {
			console.log("✅ Action marked as read.");
		} else {
			console.error("❌ Action NOT marked as read.");
		}
	}

	// 4. Delete Task
	console.log("4. Deleting Task...");
	await deleteTask(taskId, userId);

	await new Promise((r) => setTimeout(r, 1000));

	logs = await getActions({ userId: "other-user", limit: 10 });
	const deleteLog = logs.find(
		(l) => l.entityId === taskId && l.actionType === "delete",
	);

	if (deleteLog) {
		console.log("✅ Delete action logged:", deleteLog.id);
	} else {
		console.error("❌ Delete action NOT found!");
	}

	console.log("Verification Complete.");
	process.exit(0);
}

verify().catch(console.error);
