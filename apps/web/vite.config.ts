import { resolve } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		react(),
	],
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
			"next/navigation": resolve(__dirname, "./src/compat/next-navigation.ts"),
			"next/link": resolve(__dirname, "./src/compat/next-link.tsx"),
		},
	},
	server: {
		port: 3000,
		proxy: {
			// Same-origin in dev: forward API + auth to the Hono server, keeping the
			// Host header so the session cookie stays first-party.
			"/api": {
				target: "http://localhost:3001",
				changeOrigin: false,
			},
		},
	},
});
