import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;

let dbInstance: DB | null = null;
let clientInstance: ReturnType<typeof postgres> | null = null;

export function getDb(): DB {
	if (!dbInstance) {
		const connectionString = process.env.DATABASE_URL;
		if (!connectionString) {
			throw new Error("DATABASE_URL environment variable is not set");
		}

		clientInstance = postgres(connectionString, {
			prepare: false,
		});

		dbInstance = drizzle({ client: clientInstance, schema });
	}

	return dbInstance;
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
