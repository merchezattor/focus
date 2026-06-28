import { createFileRoute, redirect } from "@tanstack/react-router";

// The original /today route just redirected to the dashboard at /.
export const Route = createFileRoute("/_main/today")({
	beforeLoad: () => {
		throw redirect({ to: "/" });
	},
});
