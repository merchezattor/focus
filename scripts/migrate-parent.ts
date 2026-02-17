import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	console.error("DATABASE_URL is not set");
	process.exit(1);
}

const sql = postgres(connectionString);

async function migrate() {
	console.log("Starting migration: goal_id → parent_id + parent_type");

	await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS parent_id TEXT`;
	await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS parent_type TEXT`;

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

	await sql`ALTER TABLE projects DROP COLUMN IF EXISTS goal_id`;

	console.log(
		"Migration complete! You can now update the schema and run `bun run db:migrate`.",
	);

	await sql.end();
}

migrate().catch((err) => {
	console.error("Migration failed:", err);
	process.exit(1);
});
