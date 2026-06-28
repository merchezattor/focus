// Same-origin fetch helper for the JSON REST API.
export async function apiGet<T>(path: string): Promise<T> {
	const res = await fetch(path, { credentials: "include" });
	if (!res.ok) {
		throw new Error(`GET ${path} failed: ${res.status}`);
	}
	return res.json() as Promise<T>;
}
