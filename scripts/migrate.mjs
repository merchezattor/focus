import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;
const MIGRATIONS_FOLDER = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"../drizzle",
);

const sleep = (ms) =>
	new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

function isTransientDatabaseError(error) {
	const codes = new Set(
		[error?.code, error?.errno, error?.cause?.code, error?.cause?.errno]
			.filter(Boolean)
			.map(String),
	);

	const message = [
		error instanceof Error ? error.message : String(error),
		error?.cause instanceof Error ? error.cause.message : "",
	]
		.join(" ")
		.toLowerCase();

	return (
		codes.has("ECONNREFUSED") ||
		codes.has("ECONNRESET") ||
		codes.has("ETIMEDOUT") ||
		codes.has("EAI_AGAIN") ||
		codes.has("ENOTFOUND") ||
		codes.has("57P03") ||
		message.includes("connection refused") ||
		message.includes("connect timeout") ||
		message.includes("database system is starting up") ||
		message.includes("the database system is starting up")
	);
}

async function runMigrations() {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error("DATABASE_URL is not defined");
	}

	const startedAt = Date.now();
	console.log(`⏳ Running migrations from ${MIGRATIONS_FOLDER}...`);

	let lastError;

	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		const client = postgres(databaseUrl, {
			max: 1,
			prepare: false,
			connect_timeout: 30,
		});

		try {
			const db = drizzle(client);
			await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

			await client.end();
			console.log(`✅ Migrations completed in ${Date.now() - startedAt}ms`);
			return;
		} catch (error) {
			lastError = error;
			await client.end();

			if (!isTransientDatabaseError(error) || attempt === MAX_RETRIES) {
				throw error;
			}

			const delayMs = BASE_RETRY_DELAY_MS * attempt;
			console.warn(
				`⚠️ Migration attempt ${attempt} failed due to a transient database error. Retrying in ${delayMs}ms...`,
			);
			await sleep(delayMs);
		}
	}

	throw lastError;
}

try {
	await runMigrations();
} catch (error) {
	console.error("❌ Migration failed");
	console.error(error);
	process.exitCode = 1;
}
