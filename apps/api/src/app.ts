import { auth } from "@focus/core/auth";
import { Hono } from "hono";
import type { AppEnv } from "./auth-context";
import { rateLimitMiddleware } from "./rate-limit-middleware";
import { actionsRouter } from "./routes/actions";
import { goalsRouter } from "./routes/goals";
import { mcpRouter } from "./routes/mcp";
import { milestonesRouter } from "./routes/milestones";
import { projectsRouter } from "./routes/projects";
import { tasksRouter } from "./routes/tasks";
import { tokensRouter } from "./routes/tokens";

export const app = new Hono<AppEnv>();

app.use("*", rateLimitMiddleware);

// Liveness probe (unauthenticated).
app.get("/api/health", (c) => c.json({ status: "ok" }));

// better-auth — replaces the Next `toNextJsHandler`.
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// REST resources.
app.route("/api/tasks", tasksRouter);
app.route("/api/projects", projectsRouter);
app.route("/api/goals", goalsRouter);
app.route("/api/milestones", milestonesRouter);
app.route("/api/actions", actionsRouter);
app.route("/api/tokens", tokensRouter);

// MCP streamable-HTTP endpoint.
app.route("/api/mcp", mcpRouter);
