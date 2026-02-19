import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
	database: drizzleAdapter(getDb(), {
		provider: "pg",
		schema: {
			...schema,
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification,
		},
	}),
	trustedOrigins: [process.env.BETTER_AUTH_BASE_URL!],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		useSecureCookies: true,
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		},
	},
});
