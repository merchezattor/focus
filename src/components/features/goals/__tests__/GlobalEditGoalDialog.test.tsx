import { useAtom } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { goalToEditAtom } from "@/lib/atoms";
import { createGoal } from "@/test/fixtures";
import { render, screen } from "@/test/test-utils";
import { GlobalEditGoalDialog } from "../GlobalEditGoalDialog";

vi.mock("jotai", async () => {
	const actual = await vi.importActual("jotai");
	return {
		...actual,
		useAtom: vi.fn(),
	};
});

describe("GlobalEditGoalDialog", () => {
	const mockGoal = createGoal({
		id: "test-goal-1",
		name: "Test Goal",
		description: "Test description",
		priority: "p1",
		color: "#ef4444",
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders edit dialog when goalToEdit is set", () => {
		(useAtom as ReturnType<typeof vi.fn>).mockImplementation((atom) => {
			if (atom === goalToEditAtom) {
				return [mockGoal, vi.fn()];
			}
			return [null, vi.fn()];
		});

		render(<GlobalEditGoalDialog />);

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Edit Goal" }),
		).toBeInTheDocument();
	});

	it("does not render when goalToEdit is null", () => {
		(useAtom as ReturnType<typeof vi.fn>).mockImplementation((atom) => {
			if (atom === goalToEditAtom) {
				return [null, vi.fn()];
			}
			return [null, vi.fn()];
		});

		render(<GlobalEditGoalDialog />);

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("pre-fills form with goal data", () => {
		(useAtom as ReturnType<typeof vi.fn>).mockImplementation((atom) => {
			if (atom === goalToEditAtom) {
				return [mockGoal, vi.fn()];
			}
			return [null, vi.fn()];
		});

		render(<GlobalEditGoalDialog />);

		const nameInput = screen.getByDisplayValue("Test Goal");
		expect(nameInput).toBeInTheDocument();

		const descriptionInput = screen.getByDisplayValue("Test description");
		expect(descriptionInput).toBeInTheDocument();
	});

	it("shows Save button instead of Create Goal", () => {
		(useAtom as ReturnType<typeof vi.fn>).mockImplementation((atom) => {
			if (atom === goalToEditAtom) {
				return [mockGoal, vi.fn()];
			}
			return [null, vi.fn()];
		});

		render(<GlobalEditGoalDialog />);

		expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /create goal/i }),
		).not.toBeInTheDocument();
	});

	it("shows delete button in edit mode", () => {
		(useAtom as ReturnType<typeof vi.fn>).mockImplementation((atom) => {
			if (atom === goalToEditAtom) {
				return [mockGoal, vi.fn()];
			}
			return [null, vi.fn()];
		});

		render(<GlobalEditGoalDialog />);

		expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
	});
});
