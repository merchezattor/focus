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

	await migrate(db, { migrationsFolder: "./drizzle" });

	const end = Date.now();
	console.log(`✅ Migrations completed in ${end - start}ms`);

	await migrationClient.end();
	process.exit(0);
};

runMigrate().catch((err) => {
	console.error("❌ Migration failed");
	console.error(err);
	process.exit(1);
});
