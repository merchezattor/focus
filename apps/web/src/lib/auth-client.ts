import { createAuthClient } from "better-auth/react";

// No baseURL needed: the SPA is served same-origin as the API (Caddy in prod,
// Vite proxy in dev), so better-auth defaults to the current origin.
export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_APP_URL || undefined,
});
