import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "../db";
import * as schema from "../db/schema";

const baseURL = process.env.BETTER_AUTH_BASE_URL;

// Use Secure cookies only when served over HTTPS (e.g. behind the prod reverse
// proxy). Local/LAN HTTP dev would silently drop Secure cookies, so derive it
// from the deployment URL instead of hard-coding `true`.
const useSecureCookies =
	process.env.BETTER_AUTH_SECURE_COOKIES === "true" ||
	(baseURL?.startsWith("https://") ?? false);

// Google OAuth is optional — only register it when credentials are present so a
// single-user homelab install can run with email/password alone.
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const socialProviders =
	googleClientId && googleClientSecret
		? {
				google: {
					clientId: googleClientId,
					clientSecret: googleClientSecret,
				},
			}
		: undefined;

export const auth = betterAuth({
	baseURL,
	basePath: "/api/auth",
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
	trustedOrigins: baseURL ? [baseURL] : [],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		useSecureCookies,
	},
	socialProviders,
});
