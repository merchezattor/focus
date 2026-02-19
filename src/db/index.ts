import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;

let dbInstance: DB | null = null;
let clientInstance: ReturnType<typeof postgres> | null = null;

// Check if we're in a build phase (static generation)
const isBuildPhase =
	process.env.NEXT_PHASE === "phase-production-build" ||
	(process.env.NODE_ENV === "production" && !process.env.DATABASE_URL);

export function getDb(): DB {
	if (!dbInstance) {
		const connectionString = process.env.DATABASE_URL;

		if (!connectionString) {
			// During build phase, create a placeholder to allow static generation
			if (isBuildPhase) {
				console.warn("[BUILD] DATABASE_URL not set, using placeholder");
				// Return a proxy that will throw only if actually used for DB operations
				return createPlaceholderDb();
			}
			throw new Error("DATABASE_URL environment variable is not set");
		}

		clientInstance = postgres(connectionString, {
			prepare: false,
		});

		dbInstance = drizzle({ client: clientInstance, schema });
	}

	return dbInstance;
}

// Placeholder DB for build time - throws only when actually used
function createPlaceholderDb(): DB {
	const handler = {
		get() {
			throw new Error(
				"DATABASE_URL not set - database operations not available during build",
			);
		},
	};
	return new Proxy({} as DB, handler);
}

export function getClient() {
	if (!clientInstance) {
		const connectionString = process.env.DATABASE_URL;
		if (!connectionString) {
			throw new Error("DATABASE_URL environment variable is not set");
		}

		clientInstance = postgres(connectionString, {
			prepare: false,
		});
	}

	return clientInstance;
}
