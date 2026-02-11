import { db } from "@/db";
import { actions, tasks, user } from "@/db/schema";
import { createTask, updateTask, deleteTask } from "@/lib/storage";
import { getActions, markActionsRead } from "@/lib/actions";
import { eq } from "drizzle-orm";

async function verify() {
  console.log("Starting Actions Verification...");

  const userId = "verify-user-" + Date.now();
  const taskId = "verify-task-" + Date.now();
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
  await createTask({
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
    comments: []
  }, userId);

  // Give async logging a moment
  await new Promise(r => setTimeout(r, 1000));

  let logs = await getActions({ userId: "other-user", limit: 10 }); // Viewing as "other" user to see "verify-user" actions
  let createLog = logs.find(l => l.entityId === taskId && l.actionType === "create");
  
  if (createLog) {
    console.log("✅ Create action logged:", createLog.id);
  } else {
    console.error("❌ Create action NOT found!");
  }

  // 2. Update Task
  console.log("2. Updating Task...");
  await updateTask(taskId, { title: "Updated Title" }, userId);
  
  await new Promise(r => setTimeout(r, 1000));
  
  logs = await getActions({ userId: "other-user", limit: 10 });
  let updateLog = logs.find(l => l.entityId === taskId && l.actionType === "update");

  if (updateLog) {
    console.log("✅ Update action logged:", updateLog.id);
    console.log("   Changes:", updateLog.changes);
  } else {
    console.error("❌ Update action NOT found!");
  }

  // 3. Mark as Read
  if (createLog) {
      console.log("3. Marking as Read...");
      await markActionsRead([createLog.id]);
      
      const checkParams = { userId: "other-user", isRead: true, limit: 10 };
      // getActions filers by criteria. If we request isRead=true, we should find it.
      // But wait, getActions excludes own actions. verify-user created it. other-user reads it.
      
      // We need to check the DB directly to be sure about the flag
      const record = await db.select().from(actions).where(eq(actions.id, createLog.id));
      if (record[0].isRead === true) {
          console.log("✅ Action marked as read.");
      } else {
          console.error("❌ Action NOT marked as read.");
      }
  }

  // 4. Delete Task
  console.log("4. Deleting Task...");
  await deleteTask(taskId, userId);

  await new Promise(r => setTimeout(r, 1000));

  logs = await getActions({ userId: "other-user", limit: 10 });
  let deleteLog = logs.find(l => l.entityId === taskId && l.actionType === "delete");

  if (deleteLog) {
    console.log("✅ Delete action logged:", deleteLog.id);
  } else {
    console.error("❌ Delete action NOT found!");
  }

  console.log("Verification Complete.");
  process.exit(0);
}

verify().catch(console.error);
