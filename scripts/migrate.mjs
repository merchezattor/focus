import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runMigrate = async () => {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not defined");
	}

	console.log("⏳ Running migrations...");
	const start = Date.now();

	let lastError;
	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		const migrationClient = postgres(process.env.DATABASE_URL, {
			max: 1,
			timeout: 30000,
		});

		try {
			const db = drizzle(migrationClient);
			await migrate(db, { migrationsFolder: "./drizzle" });

			const end = Date.now();
			console.log(`✅ Migrations completed in ${end - start}ms`);

			await migrationClient.end();
			return;
		} catch (error) {
			await migrationClient.end();
			lastError = error;

			const errorMessage =
				error instanceof Error ? error.message : String(error);
			const causeMessage =
				error?.cause instanceof Error ? error.cause.message : "";

			if (
				errorMessage.includes("already exists") ||
				causeMessage.includes("already exists")
			) {
				console.log("⚠️  Objects already exist, skipping migration...");
				return;
			}

			if (attempt < MAX_RETRIES) {
				console.log(
					`⚠️  Migration attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms...`,
				);
				await sleep(RETRY_DELAY_MS * attempt);
			}
		}
	}

	throw lastError;
};

runMigrate()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("❌ Migration failed after all retries");
		console.error(err);
		process.exit(1);
	});
