import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	transpilePackages: ["@focus/core"],
	outputFileTracingIncludes: {
		"/api/**": ["*"],
	},
	experimental: {
		staleTimes: {
			dynamic: 30,
			static: 180,
		},
		serverActions: {
			allowedOrigins: process.env.BETTER_AUTH_BASE_URL
				? [process.env.BETTER_AUTH_BASE_URL]
				: [],
		},
	},
};

export default nextConfig;
