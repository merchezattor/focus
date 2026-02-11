import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	experimental: {
		staleTimes: {
			dynamic: 30,
			static: 180,
		},
	},
};

export default nextConfig;
