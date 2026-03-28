import { screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { describe, expect, it } from "vitest";
import { goalToEditAtom, isAddGoalOpenAtom } from "@/lib/atoms";
import { createGoal } from "@/test/fixtures";
import { render } from "@/test/test-utils";
import { GoalList } from "../GoalList";

function renderWithStore(ui: React.ReactElement) {
	const store = createStore();

	return {
		store,
		...render(<Provider store={store}>{ui}</Provider>),
	};
}

describe("GoalList", () => {
	it("renders empty state when there are no goals", () => {
		renderWithStore(<GoalList goals={[]} />);

		expect(screen.getByText("No goals yet")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Create your first goal to define the outcomes your projects support.",
			),
		).toBeInTheDocument();
	});

	it("opens add goal dialog atom from the empty state button", async () => {
		const { user, store } = renderWithStore(<GoalList goals={[]} />);

		expect(store.get(isAddGoalOpenAtom)).toBe(false);

		await user.click(screen.getByRole("button", { name: /add goal/i }));

		expect(store.get(isAddGoalOpenAtom)).toBe(true);
	});

	it("renders goals as a flat list with due date metadata", () => {
		const goals = [
			createGoal({
				id: "goal-1",
				name: "Ship goals page",
				description: "Mirror the projects list layout",
				priority: "p1",
				dueDate: new Date("2026-01-10T00:00:00.000Z"),
				color: "#ef4444",
			}),
			createGoal({
				id: "goal-2",
				name: "Clean up navigation",
				priority: "p3",
				color: "#3b82f6",
			}),
		];

		renderWithStore(<GoalList goals={goals} />);

		expect(screen.getByText("Ship goals page")).toBeInTheDocument();
		expect(screen.getByText("Clean up navigation")).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", {
				name: /working|archived|complete|frozen/i,
			}),
		).not.toBeInTheDocument();
		expect(screen.getByText("Jan 10")).toBeInTheDocument();
	});

	it("sets the goal edit atom when edit is clicked", async () => {
		const goal = createGoal({
			id: "goal-edit-1",
			name: "Editable goal",
		});
		const { user, store } = renderWithStore(<GoalList goals={[goal]} />);

		expect(store.get(goalToEditAtom)).toBeNull();

		await user.click(screen.getByRole("button", { name: /edit goal/i }));

		expect(store.get(goalToEditAtom)).toEqual(goal);
	});
});
