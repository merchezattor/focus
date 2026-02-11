import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// config({ path: ".env" }); // or .env.local

const sql = neon(
	process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!,
);
export const db = drizzle({ client: sql, schema });
