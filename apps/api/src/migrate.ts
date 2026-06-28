import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * Apply pending Drizzle migrations. Bundled into the API by tsup, so the
 * container runs migrations on startup without a separate node_modules.
 * The SQL files live at MIGRATIONS_DIR (set to the copied drizzle/ folder).
 */
export async function runMigrations(): Promise<void> {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is not set");

	const dir = process.env.MIGRATIONS_DIR ?? "./drizzle";
	const client = postgres(url, { max: 1, prepare: false });
	try {
		console.log(`[api] running migrations from ${dir}...`);
		await migrate(drizzle(client), { migrationsFolder: dir });
		console.log("[api] migrations complete");
	} finally {
		await client.end();
	}
}
