import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	environment: "jsdom",
	globals: true,
	setupFiles: ["./vitest.setup.ts"],
	test: {
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		exclude: ["node_modules", ".next", "e2e"],
		coverage: {
			provider: "v8",
			thresholds: {
				lines: 70,
				functions: 70,
				branches: 60,
				statements: 70,
			},
		},
	},
	resolve: {
		alias: {
			"@": "./src/",
		},
	},
});
