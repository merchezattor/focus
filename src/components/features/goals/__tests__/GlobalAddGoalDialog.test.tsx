import { useAtom } from "jotai";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isAddGoalOpenAtom } from "@/lib/atoms";
import { render, screen } from "@/test/test-utils";
import { GlobalAddGoalDialog } from "../GlobalAddGoalDialog";

vi.mock("jotai", () => ({
	atom: (value: unknown) => ({ current: value }),
	useAtom: vi.fn(),
	Provider: ({ children }: { children: ReactNode }) => children,
}));

describe("GlobalAddGoalDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders dialog when atom is true", () => {
		(useAtom as ReturnType<typeof vi.fn>).mockImplementation((atom) => {
			if (atom === isAddGoalOpenAtom) {
				return [true, vi.fn()];
			}
			return [null, vi.fn()];
		});

		render(<GlobalAddGoalDialog />);

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Add Goal" }),
		).toBeInTheDocument();
	});

	it("does not render when atom is false", () => {
		(useAtom as ReturnType<typeof vi.fn>).mockImplementation((atom) => {
			if (atom === isAddGoalOpenAtom) {
				return [false, vi.fn()];
			}
			return [null, vi.fn()];
		});

		render(<GlobalAddGoalDialog />);

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
});
