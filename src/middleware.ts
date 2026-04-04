import { type NextRequest, NextResponse } from "next/server";
import { getRateLimitOptions, rateLimit } from "@/lib/rate-limit";

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (
		pathname.startsWith("/api/auth") ||
		pathname.startsWith("/api/fix-migrations")
	) {
		return NextResponse.next();
	}

	const forwarded = request.headers.get("x-forwarded-for");
	const ip = request.ip || forwarded?.split(",")[0]?.trim() || "unknown";
	const key = `${ip}:${pathname}`;
	const options = getRateLimitOptions(pathname);
	const result = rateLimit(key, options);

	if (!result.allowed) {
		const retryAfterSec = Math.ceil(result.retryAfterMs / 1000);
		return NextResponse.json(
			{ error: "Rate limit exceeded" },
			{
				status: 429,
				headers: { "Retry-After": String(retryAfterSec) },
			},
		);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/api/:path*"],
};
