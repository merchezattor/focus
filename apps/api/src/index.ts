import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { app } from "./app";

// Load env for standalone/dev runs (repo-root .env.local then .env).
// In Docker these come from the container environment instead.
config({ path: "../../.env.local" });
config({ path: "../../.env" });

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
	console.log(`[api] listening on http://localhost:${info.port}`);
});
