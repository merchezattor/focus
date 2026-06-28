interface RateLimitEntry {
	timestamps: number[];
}

interface RateLimitOptions {
	windowMs: number;
	maxRequests: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
const MAX_ENTRY_AGE_MS = 120_000;

let lastCleanup = Date.now();

function cleanup() {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL) return;
	lastCleanup = now;

	for (const [key, entry] of store) {
		entry.timestamps = entry.timestamps.filter(
			(t) => now - t < MAX_ENTRY_AGE_MS,
		);
		if (entry.timestamps.length === 0) {
			store.delete(key);
		}
	}
}

export function rateLimit(
	key: string,
	options: RateLimitOptions,
): { allowed: boolean; retryAfterMs: number } {
	cleanup();

	const now = Date.now();
	let entry = store.get(key);

	if (!entry) {
		entry = { timestamps: [] };
		store.set(key, entry);
	}

	entry.timestamps = entry.timestamps.filter((t) => now - t < options.windowMs);

	if (entry.timestamps.length >= options.maxRequests) {
		const oldestInWindow = entry.timestamps[0];
		const retryAfterMs = oldestInWindow + options.windowMs - now;
		return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
	}

	entry.timestamps.push(now);
	return { allowed: true, retryAfterMs: 0 };
}

const RATE_LIMITS: Record<string, RateLimitOptions> = {
	"/api/mcp": { windowMs: 60_000, maxRequests: 20 },
	"/api/tokens": { windowMs: 60_000, maxRequests: 30 },
	default: { windowMs: 60_000, maxRequests: 100 },
};

export function getRateLimitOptions(pathname: string): RateLimitOptions {
	for (const [prefix, opts] of Object.entries(RATE_LIMITS)) {
		if (pathname.startsWith(prefix)) return opts;
	}
	return RATE_LIMITS.default;
}
