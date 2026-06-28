import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { app } from "./app";
import { runMigrations } from "./migrate";

// Load env for standalone/dev runs (repo-root .env.local then .env).
// In Docker these come from the container environment instead.
config({ path: "../../.env.local" });
config({ path: "../../.env" });

const port = Number(process.env.PORT ?? 3001);

async function main() {
	// Opt-in migrate-on-start (the Docker image sets RUN_MIGRATIONS=true);
	// local dev migrates via `pnpm db:migrate` instead.
	if (process.env.RUN_MIGRATIONS === "true") {
		await runMigrations();
	}

	serve({ fetch: app.fetch, port }, (info) => {
		console.log(`[api] listening on http://localhost:${info.port}`);
	});
}

main().catch((err) => {
	console.error("[api] failed to start:", err);
	process.exit(1);
});
