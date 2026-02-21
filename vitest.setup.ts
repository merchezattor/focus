import "@testing-library/dom";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import { server } from "@/test/mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

// Cleanup after each test
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

// Mock next/navigation
vi.mock("next/navigation", () => {
	const useRouter = vi.fn(() => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
	}));
	const usePathname = vi.fn(() => "/");
	const useSearchParams = vi.fn(() => new URLSearchParams());
	const useParams = vi.fn(() => ({}));

	return {
		useRouter,
		usePathname,
		useSearchParams,
		useParams,
	};
});

// Mock next/headers
vi.mock("next/headers", () => {
	const headers = vi.fn(() => new Headers());
	const cookies = vi.fn(() => ({
		get: vi.fn(),
		set: vi.fn(),
		delete: vi.fn(),
		getAll: vi.fn(),
		has: vi.fn(),
	}));

	return {
		headers,
		cookies,
	};
});

// Mock crypto.randomUUID
Object.defineProperty(globalThis, "crypto", {
	value: {
		randomUUID: vi.fn(() => "test-uuid-1234"),
	},
});

// Mock matchMedia for next-themes
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Filter console.error for React act() warnings in test environment
const originalError = console.error;
beforeAll(() => {
	console.error = (...args: unknown[]) => {
		if (
			typeof args[0] === "string" &&
			(args[0].includes("Warning: An update to") ||
				args[0].includes("Warning: ReactDOM.render is no longer supported") ||
				args[0].includes("Warning: Use of defaultProps in function components"))
		) {
			return;
		}
		originalError.call(console, ...args);
	};
});

afterAll(() => {
	console.error = originalError;
});
