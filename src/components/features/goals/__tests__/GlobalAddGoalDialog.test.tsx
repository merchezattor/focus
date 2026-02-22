import { useAtom } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { GlobalAddGoalDialog, isAddGoalOpenAtom } from "../GlobalAddGoalDialog";

vi.mock("jotai", async () => {
	const actual = await vi.importActual("jotai");
	return {
		...actual,
		useAtom: vi.fn(),
	};
});

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
