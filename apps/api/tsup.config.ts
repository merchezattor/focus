import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	platform: "node",
	target: "node20",
	// Bundle the workspace core (shipped as TS source) into the output so the
	// runtime never has to resolve `.ts` files from node_modules.
	noExternal: [/@focus\/core/],
	clean: true,
	sourcemap: true,
});
