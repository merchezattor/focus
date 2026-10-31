import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetActions = vi.fn();

vi.mock("../../../actions", () => ({
	getActions: (...args: unknown[]) => mockGetActions(...args),
	logAction: vi.fn(),
	markActionsRead: vi.fn(),
}));
vi.mock("../../../storage", () => ({ getTaskByIdForUser: vi.fn() }));

import { actionTools } from "../actions";

const context = { user: { id: "user-123" }, tokenName: "t" } as never;
const found = actionTools.find((t) => t.name === "focus_list_actions")!;
const listActions = {
	description: found.description,
	handler: found.handler as (args: unknown, ctx: never) => Promise<unknown>,
};

describe("focus_list_actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetActions.mockResolvedValue([]);
	});

	it("does not include the owner's own user actions by default", async () => {
		await listActions.handler({}, context);
		expect(mockGetActions.mock.calls[0][0].includeOwn).toBeFalsy();
	});

	it("passes includeOwn: true through to getActions", async () => {
		await listActions.handler({ includeOwn: true }, context);
		expect(mockGetActions.mock.calls[0][0].includeOwn).toBe(true);
	});

	it("passes isRead through to getActions", async () => {
		await listActions.handler({ isRead: false }, context);
		expect(mockGetActions.mock.calls[0][0].isRead).toBe(false);
	});

	it("documents includeOwn in the description", () => {
		expect(listActions.description).toContain("includeOwn");
	});
});
