import { getRateLimitOptions, rateLimit } from "@focus/core/rate-limit";
import type { MiddlewareHandler } from "hono";

/**
 * Port of the Next `proxy.ts` middleware: per-IP+path sliding-window rate
 * limiting. The auth endpoints are exempt (better-auth has its own limits).
 */
export const rateLimitMiddleware: MiddlewareHandler = async (c, next) => {
	const pathname = new URL(c.req.url).pathname;

	if (pathname.startsWith("/api/auth")) {
		return next();
	}

	const forwarded = c.req.header("x-forwarded-for");
	const ip = forwarded?.split(",")[0]?.trim() || "unknown";
	const key = `${ip}:${pathname}`;
	const options = getRateLimitOptions(pathname);
	const result = rateLimit(key, options);

	if (!result.allowed) {
		const retryAfterSec = Math.ceil(result.retryAfterMs / 1000);
		return c.json({ error: "Rate limit exceeded" }, 429, {
			"Retry-After": String(retryAfterSec),
		});
	}

	return next();
};
