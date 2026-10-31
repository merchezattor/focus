import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../../../../types";

const mockSearchTasksPage = vi.fn();
const mockGetTaskByIdForUser = vi.fn();

vi.mock("../../../storage", () => ({
	searchTasksPage: (...args: unknown[]) => mockSearchTasksPage(...args),
	getTaskByIdForUser: (...args: unknown[]) => mockGetTaskByIdForUser(...args),
	createComment: vi.fn(),
	createTask: vi.fn(),
	createTasksBulk: vi.fn(),
	deleteTask: vi.fn(),
	getTaskById: vi.fn(),
	searchTasks: vi.fn(),
	updateTask: vi.fn(),
}));

vi.mock("../../../actions", () => ({ logAction: vi.fn() }));

import { taskTools } from "../tasks";

const context = {
	user: { id: "user-123" },
	actorType: "agent" as const,
	tokenName: "t",
} as never;

const tool = (name: string) => {
	const t = taskTools.find((x) => x.name === name);
	if (!t) throw new Error(`no tool ${name}`);
	return t;
};

const makeTask = (n: number, over: Partial<Task> = {}): Task =>
	({
		id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
		title: `Task ${n}`,
		projectId: null,
		dueDate: null,
		completedAt: null,
		priority: "p2",
		status: "todo",
		orderNum: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
		commentCount: 2,
		...over,
	}) as Task;

const parse = (res: { content: Array<{ text: string }> }) =>
	JSON.parse(res.content[0].text);

describe.each(["focus_list_tasks", "focus_list_inbox"])("%s", (name) => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSearchTasksPage.mockResolvedValue({ tasks: [], total: 0 });
	});

	it('accepts status "all" and review/archived, passing them through', async () => {
		await tool(name).handler({ status: "all" }, context);
		expect(mockSearchTasksPage.mock.calls[0][1].status).toBe("all");

		await tool(name).handler({ status: ["review", "archived"] }, context);
		expect(mockSearchTasksPage.mock.calls[1][1].status).toEqual([
			"review",
			"archived",
		]);
	});

	it("leaves status undefined when omitted (Default listing)", async () => {
		await tool(name).handler({}, context);
		expect(mockSearchTasksPage.mock.calls[0][1].status).toBeUndefined();
	});

	it("rejects an empty status array instead of falling back to the Default listing", async () => {
		const res = await tool(name).handler({ status: [] }, context);
		expect(res.isError).toBe(true);
		expect(mockSearchTasksPage).not.toHaveBeenCalled();
	});

	it("rejects an unknown status", async () => {
		const res = await tool(name).handler({ status: "bogus" }, context);
		expect(res.isError).toBe(true);
	});

	it("requests comment counts, with default limit 10 and offset 0", async () => {
		await tool(name).handler({}, context);
		const filters = mockSearchTasksPage.mock.calls[0][1];
		expect(filters.comments).toBe("count");
		expect(filters.limit).toBe(10);
		expect(filters.offset).toBe(0);
	});

	it("keeps data an array and reports hasMore true when more remain", async () => {
		mockSearchTasksPage.mockResolvedValue({
			tasks: [makeTask(1), makeTask(2)],
			total: 5,
		});
		const body = parse(await tool(name).handler({ limit: 2 }, context));
		expect(body.success).toBe(true);
		expect(Array.isArray(body.data)).toBe(true);
		expect(body.page).toEqual({
			total: 5,
			offset: 0,
			limit: 2,
			hasMore: true,
		});
	});

	it("reports hasMore false on the last page and ignores limit/offset in total", async () => {
		mockSearchTasksPage.mockResolvedValue({
			tasks: [makeTask(5)],
			total: 5,
		});
		const body = parse(
			await tool(name).handler({ limit: 2, offset: 4 }, context),
		);
		expect(mockSearchTasksPage.mock.calls[0][1].offset).toBe(4);
		expect(body.page).toEqual({
			total: 5,
			offset: 4,
			limit: 2,
			hasMore: false,
		});
	});

	it("returns commentCount and no comments key on listed tasks", async () => {
		mockSearchTasksPage.mockResolvedValue({
			tasks: [makeTask(1)],
			total: 1,
		});
		const body = parse(await tool(name).handler({}, context));
		expect(body.data[0].commentCount).toBe(2);
		expect("comments" in body.data[0]).toBe(false);
	});

	it("describes the remaining traps", () => {
		const d = tool(name).description;
		expect(d).toContain("hasMore");
		expect(d).toContain("offset");
		expect(d).toContain('status: "all"');
		expect(d).toContain("commentCount");
		expect(d).toContain("focus_get_task");
	});
});

describe("focus_get_task", () => {
	it("still returns full comments", async () => {
		mockGetTaskByIdForUser.mockResolvedValue(
			makeTask(1, {
				comments: [
					{ id: "c1", content: "hello", postedAt: new Date() },
				] as never,
			}),
		);
		const body = parse(
			await tool("focus_get_task").handler(
				{ id: "00000000-0000-4000-8000-000000000001" },
				context,
			),
		);
		expect(JSON.stringify(body)).toContain("hello");
	});
});

describe("tool descriptions", () => {
	it("focus_create_task says it defaults to cold; update mentions done for completion", () => {
		expect(tool("focus_create_task").description.toLowerCase()).toContain(
			"cold",
		);
		const all = taskTools.map((t) => t.description).join("\n");
		expect(all).toMatch(/complet\w* .*done/i);
	});
});
