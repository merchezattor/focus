import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const runMigrate = async () => {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not defined");
	}

	const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
	const db = drizzle(migrationClient);

	console.log("⏳ Running migrations...");

	const start = Date.now();

	try {
		await migrate(db, { migrationsFolder: "./drizzle" });
		const end = Date.now();
		console.log(`✅ Migrations completed in ${end - start}ms`);
	} catch (error) {
		// Ignore "already exists" errors - database is already up to date
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (errorMessage.includes("already exists")) {
			console.log("⚠️  Objects already exist, skipping migration...");
		} else {
			throw error;
		}
	}

	await migrationClient.end();
	process.exit(0);
};

runMigrate().catch((err) => {
	console.error("❌ Migration failed");
	console.error(err);
	process.exit(1);
});
