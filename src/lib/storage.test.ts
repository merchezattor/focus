import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchTasks } from "./storage";

// Let's create a robust mock for drizzle-orm's fluent interface
const mockWhere = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnValue([]);
const mockFrom = vi.fn().mockReturnValue({
	where: mockWhere,
	orderBy: mockOrderBy,
	limit: mockLimit,
});
const mockSelect = vi.fn().mockReturnValue({
	from: mockFrom,
});

vi.mock("@/db", () => ({
	getDb: () => ({
		select: mockSelect,
	}),
}));

// We mock drizzle-orm conditions to easily inspect them
vi.mock("drizzle-orm", async () => {
	const actual =
		await vi.importActual<typeof import("drizzle-orm")>("drizzle-orm");

	const mockSql = vi.fn((strings, ...values) => ({
		type: "sql",
		strings,
		values,
	}));
	(mockSql as any).join = vi.fn((arr) => ({ type: "sql.join", arr }));

	return {
		...actual,
		and: vi.fn((...args) => ({ type: "and", args })),
		eq: vi.fn((col, val) => ({ type: "eq", col, val })),
		inArray: vi.fn((col, val) => ({ type: "inArray", col, val })),
		sql: mockSql,
	};
});

describe("storage.ts - searchTasks", () => {
	const mockUserId = "user-123";

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("Test Case 1: passing lastActionType pushes the subquery condition", async () => {
		await searchTasks(mockUserId, { lastActionType: ["processed"] });

		// We just want to check that `inArray` was called pushing the subquery
		// Since searchTasks dynamically builds the condition array,
		// we verify the `where` method got our mocked `and` conditions.
		expect(mockSelect).toHaveBeenCalled();
		expect(mockWhere).toHaveBeenCalled();

		const whereArgs = mockWhere.mock.calls[0][0];
		expect(whereArgs.type).toBe("and");

		// Look for the inArray condition inside the `and` arguments
		const hasInArrayCondition = whereArgs.args.some(
			(arg: any) => arg && arg.type === "inArray",
		);
		expect(hasInArrayCondition).toBe(true);
	});

	it("Test Case 2 & 3: combines lastActionType with overdue date filter", async () => {
		await searchTasks(mockUserId, {
			lastActionType: ["processed"],
			dueDateStr: "overdue",
		});

		expect(mockWhere).toHaveBeenCalled();
		const whereArgs = mockWhere.mock.calls[0][0];

		// The `and` should contain our dueDate logic (lt and eq) and our inArray subquery
		const args = whereArgs.args;
		const hasInArrayCondition = args.some(
			(arg: any) => arg && arg.type === "inArray",
		);
		expect(hasInArrayCondition).toBe(true);

		// For overdue, it generates an AND condition inside the main AND
		const hasOverdueCondition = args.some(
			(arg: any) => arg && arg.type === "and", // the nested AND for due_date < today AND completed = false
		);
		expect(hasOverdueCondition).toBe(true);
	});
});
