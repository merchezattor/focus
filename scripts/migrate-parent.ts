/**
 * Migration script: Convert goal_id → parent_id + parent_type
 *
 * Run BEFORE updating the schema (before `bun run db:migrate`).
 * Usage: bun run scripts/migrate-parent.ts
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(
	process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!,
);

async function migrate() {
	console.log("Starting migration: goal_id → parent_id + parent_type");

	// 1. Add new columns if they don't exist
	await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS parent_id TEXT`;
	await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS parent_type TEXT`;

	// 2. Copy goal_id data to parent_id/parent_type
	const result = await sql`
        UPDATE projects 
        SET parent_id = goal_id, parent_type = 'goal'
        WHERE goal_id IS NOT NULL AND parent_id IS NULL
        RETURNING id, goal_id, parent_id, parent_type
    `;

	console.log(`Migrated ${result.length} projects with goal references:`);
	for (const row of result) {
		console.log(
			`  Project ${row.id}: goal_id=${row.goal_id} → parent_id=${row.parent_id}, parent_type=${row.parent_type}`,
		);
	}

	// 3. Drop the old goal_id column
	await sql`ALTER TABLE projects DROP COLUMN IF EXISTS goal_id`;

	console.log(
		"Migration complete! You can now update the schema and run `bun run db:migrate`.",
	);
}

migrate().catch((err) => {
	console.error("Migration failed:", err);
	process.exit(1);
});
