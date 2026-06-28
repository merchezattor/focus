// Compatibility shim for `next/link`, aliased to "next/link" in vite.config.ts.
import { Link as TanstackLink } from "@tanstack/react-router";
import { type AnchorHTMLAttributes, forwardRef } from "react";

type NextLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
	href: string;
	prefetch?: boolean;
	replace?: boolean;
};

const Link = forwardRef<HTMLAnchorElement, NextLinkProps>(function Link(
	{ href, prefetch: _prefetch, replace, children, ...rest },
	ref,
) {
	return (
		// biome-ignore lint/suspicious/noExplicitAny: TanStack's typed `to` accepts a runtime string path
		<TanstackLink ref={ref} to={href as any} replace={replace} {...rest}>
			{children}
		</TanstackLink>
	);
});

export default Link;
