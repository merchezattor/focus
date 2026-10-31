// Compatibility shim so components written against `next/navigation` keep
// working in the Vite SPA. Aliased to "next/navigation" in vite.config.ts +
// tsconfig paths. `router.refresh()` maps to TanStack Query invalidation,
// which is how the SPA re-fetches data that SSR used to re-render.
import {
	useRouterState,
	useRouter as useTanstackRouter,
} from "@tanstack/react-router";
import { queryClient } from "@/lib/query-client";

type Navigate = (opts: { to: string; replace?: boolean }) => void;

export function useRouter() {
	const router = useTanstackRouter();
	const navigate = router.navigate as unknown as Navigate;
	return {
		push: (href: string) => navigate({ to: href }),
		replace: (href: string) => navigate({ to: href, replace: true }),
		back: () => router.history.back(),
		forward: () => router.history.forward(),
		refresh: () => queryClient.invalidateQueries(),
		prefetch: () => {},
	};
}

export function usePathname(): string {
	return useRouterState({ select: (s) => s.location.pathname });
}

export function useSearchParams(): URLSearchParams {
	const searchStr = useRouterState({ select: (s) => s.location.searchStr });
	return new URLSearchParams(searchStr);
}

export function redirect(href: string): never {
	window.location.assign(href);
	throw new Error("REDIRECT");
}

export function notFound(): never {
	throw new Error("NEXT_NOT_FOUND");
}
