import { describe, expect, it } from "vitest";
import { z } from "zod";
import { goalSchema } from "../goal";
import { projectSchema } from "../project";
import { commentSchema, taskSchema } from "../task";

const createTaskSchema = taskSchema
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		projectId: z
			.string()
			.uuid()
			.or(z.literal("inbox"))
			.nullable()
			.or(z.literal("")),
		dueDate: z
			.string()
			.datetime()
			.nullable()
			.optional()
			.transform((val: string | null | undefined) =>
				val ? new Date(val) : null,
			),
		planDate: z
			.string()
			.datetime()
			.nullable()
			.optional()
			.transform((val: string | null | undefined) =>
				val ? new Date(val) : null,
			),
	});

describe("taskSchema Validation", () => {
	const validTask = {
		id: "550e8400-e29b-41d4-a716-446655440000",
		title: "Test Task",
		description: "Test description",
		completed: false,
		projectId: "550e8400-e29b-41d4-a716-446655440001",
		dueDate: new Date("2025-12-31"),
		planDate: new Date("2025-12-25"),
		priority: "p1" as const,
		status: "todo" as const,
		comments: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	describe("Accepts valid task", () => {
		it("should accept valid task with all fields", () => {
			const result = taskSchema.safeParse(validTask);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.title).toBe("Test Task");
			}
		});

		it("should accept task with optional fields omitted", () => {
			const minimalTask = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				title: "Minimal Task",
				completed: false,
				projectId: null,
				dueDate: null,
				priority: "p4" as const,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const result = taskSchema.safeParse(minimalTask);
			expect(result.success).toBe(true);
		});

		it("should use default status when not provided", () => {
			const taskWithoutStatus = {
				...validTask,
				status: undefined,
			};
			const result = taskSchema.safeParse(taskWithoutStatus);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.status).toBe("todo");
			}
		});
	});

	describe("Rejects empty title", () => {
		it("should reject empty string title", () => {
			const result = taskSchema.safeParse({
				...validTask,
				title: "",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.path).toContain("title");
			}
		});

		it("should accept whitespace-only title (Zod default behavior)", () => {
			const result = taskSchema.safeParse({
				...validTask,
				title: "   ",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("Rejects title over 200 chars", () => {
		it("should reject title with 201 characters", () => {
			const result = taskSchema.safeParse({
				...validTask,
				title: "a".repeat(201),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.path).toContain("title");
			}
		});

		it("should accept title with exactly 200 characters", () => {
			const result = taskSchema.safeParse({
				...validTask,
				title: "a".repeat(200),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("Rejects invalid priority", () => {
		it("should reject priority 'p0'", () => {
			const result = taskSchema.safeParse({
				...validTask,
				priority: "p0",
			});
			expect(result.success).toBe(false);
		});

		it("should reject priority 'high'", () => {
			const result = taskSchema.safeParse({
				...validTask,
				priority: "high",
			});
			expect(result.success).toBe(false);
		});

		it("should reject priority number", () => {
			const result = taskSchema.safeParse({
				...validTask,
				priority: 1,
			});
			expect(result.success).toBe(false);
		});

		it("should accept all valid priorities", () => {
			const priorities = ["p1", "p2", "p3", "p4"];
			for (const priority of priorities) {
				const result = taskSchema.safeParse({
					...validTask,
					priority,
				});
				expect(result.success).toBe(true);
			}
		});
	});

	describe("Rejects invalid status", () => {
		it("should reject status 'pending'", () => {
			const result = taskSchema.safeParse({
				...validTask,
				status: "pending",
			});
			expect(result.success).toBe(false);
		});

		it("should reject status 'completed'", () => {
			const result = taskSchema.safeParse({
				...validTask,
				status: "completed",
			});
			expect(result.success).toBe(false);
		});

		it("should accept all valid statuses", () => {
			const statuses = ["todo", "in_progress", "review", "done"];
			for (const status of statuses) {
				const result = taskSchema.safeParse({
					...validTask,
					status,
				});
				expect(result.success).toBe(true);
			}
		});
	});

	describe("Validates date fields", () => {
		it("should accept null for dueDate", () => {
			const result = taskSchema.safeParse({
				...validTask,
				dueDate: null,
			});
			expect(result.success).toBe(true);
		});

		it("should accept null for projectId", () => {
			const result = taskSchema.safeParse({
				...validTask,
				projectId: null,
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid date format for dueDate", () => {
			const result = taskSchema.safeParse({
				...validTask,
				dueDate: "not-a-date" as never,
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid date format for planDate", () => {
			const result = taskSchema.safeParse({
				...validTask,
				planDate: "not-a-date" as never,
			});
			expect(result.success).toBe(false);
		});

		it("should accept optional planDate", () => {
			const { planDate, ...taskWithoutPlanDate } = validTask;
			const result = taskSchema.safeParse(taskWithoutPlanDate);
			expect(result.success).toBe(true);
		});
	});

	describe("Validates description field", () => {
		it("should accept description up to 1000 characters", () => {
			const result = taskSchema.safeParse({
				...validTask,
				description: "a".repeat(1000),
			});
			expect(result.success).toBe(true);
		});

		it("should reject description over 1000 characters", () => {
			const result = taskSchema.safeParse({
				...validTask,
				description: "a".repeat(1001),
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Validates id field", () => {
		it("should reject non-uuid id", () => {
			const result = taskSchema.safeParse({
				...validTask,
				id: "not-a-uuid",
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid uuid format", () => {
			const result = taskSchema.safeParse({
				...validTask,
				id: "12345",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Validates comments array", () => {
		it("should accept valid comments array", () => {
			const result = taskSchema.safeParse({
				...validTask,
				comments: [
					{
						id: "550e8400-e29b-41d4-a716-446655440000",
						content: "Comment 1",
						postedAt: new Date(),
					},
				],
			});
			expect(result.success).toBe(true);
		});

		it("should accept empty comments array", () => {
			const result = taskSchema.safeParse({
				...validTask,
				comments: [],
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid comment structure", () => {
			const result = taskSchema.safeParse({
				...validTask,
				comments: [{ invalid: "structure" }],
			});
			expect(result.success).toBe(false);
		});
	});
});

describe("projectSchema Validation", () => {
	const validProject = {
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Test Project",
		color: "#FF5733",
		description: "Test description",
		parentId: null,
		parentType: null,
		viewType: "list" as const,
		isFavorite: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	describe("Accepts valid project", () => {
		it("should accept valid project with all fields", () => {
			const result = projectSchema.safeParse(validProject);
			expect(result.success).toBe(true);
		});

		it("should accept project with optional fields omitted", () => {
			const minimalProject = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "Minimal Project",
				color: "#FF5733",
				isFavorite: false,
			};
			const result = projectSchema.safeParse(minimalProject);
			expect(result.success).toBe(true);
		});

		it("should use default viewType when not provided", () => {
			const { viewType, ...projectWithoutViewType } = validProject;
			const result = projectSchema.safeParse(projectWithoutViewType);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.viewType).toBe("list");
			}
		});
	});

	describe("Rejects empty name", () => {
		it("should reject empty string name", () => {
			const result = projectSchema.safeParse({
				...validProject,
				name: "",
			});
			expect(result.success).toBe(false);
		});

		it("should accept whitespace-only name (Zod default behavior)", () => {
			const result = projectSchema.safeParse({
				...validProject,
				name: "   ",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("Validates name length", () => {
		it("should reject name over 100 characters", () => {
			const result = projectSchema.safeParse({
				...validProject,
				name: "a".repeat(101),
			});
			expect(result.success).toBe(false);
		});

		it("should accept name with exactly 100 characters", () => {
			const result = projectSchema.safeParse({
				...validProject,
				name: "a".repeat(100),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("Validates color format", () => {
		it("should accept valid hex color", () => {
			const result = projectSchema.safeParse({
				...validProject,
				color: "#FF5733",
			});
			expect(result.success).toBe(true);
		});

		it("should accept lowercase hex color", () => {
			const result = projectSchema.safeParse({
				...validProject,
				color: "#ff5733",
			});
			expect(result.success).toBe(true);
		});

		it("should reject color without hash", () => {
			const result = projectSchema.safeParse({
				...validProject,
				color: "FF5733",
			});
			expect(result.success).toBe(false);
		});

		it("should reject color with invalid characters", () => {
			const result = projectSchema.safeParse({
				...validProject,
				color: "#GGGGGG",
			});
			expect(result.success).toBe(false);
		});

		it("should reject short hex color", () => {
			const result = projectSchema.safeParse({
				...validProject,
				color: "#FFF",
			});
			expect(result.success).toBe(false);
		});

		it("should reject color with wrong length", () => {
			const result = projectSchema.safeParse({
				...validProject,
				color: "#FFFFFFF",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Validates viewType", () => {
		it("should accept 'list' viewType", () => {
			const result = projectSchema.safeParse({
				...validProject,
				viewType: "list",
			});
			expect(result.success).toBe(true);
		});

		it("should accept 'board' viewType", () => {
			const result = projectSchema.safeParse({
				...validProject,
				viewType: "board",
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid viewType", () => {
			const result = projectSchema.safeParse({
				...validProject,
				viewType: "grid",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Validates parentType", () => {
		it("should accept 'goal' as parentType", () => {
			const result = projectSchema.safeParse({
				...validProject,
				parentType: "goal",
				parentId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(true);
		});

		it("should accept 'project' as parentType", () => {
			const result = projectSchema.safeParse({
				...validProject,
				parentType: "project",
				parentId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid parentType", () => {
			const result = projectSchema.safeParse({
				...validProject,
				parentType: "invalid",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Validates id field", () => {
		it("should reject non-uuid id", () => {
			const result = projectSchema.safeParse({
				...validProject,
				id: "not-a-uuid",
			});
			expect(result.success).toBe(false);
		});
	});
});

describe("goalSchema Validation", () => {
	const validGoal = {
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Test Goal",
		description: "Test description",
		priority: "p1" as const,
		dueDate: new Date("2025-12-31"),
		color: "#FF5733",
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	describe("Accepts valid goal", () => {
		it("should accept valid goal with all fields", () => {
			const result = goalSchema.safeParse(validGoal);
			expect(result.success).toBe(true);
		});

		it("should accept goal with optional fields omitted", () => {
			const minimalGoal = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				name: "Minimal Goal",
				priority: "p2" as const,
				color: "#FF5733",
			};
			const result = goalSchema.safeParse(minimalGoal);
			expect(result.success).toBe(true);
		});
	});

	describe("Rejects empty name", () => {
		it("should reject empty string name", () => {
			const result = goalSchema.safeParse({
				...validGoal,
				name: "",
			});
			expect(result.success).toBe(false);
		});

		it("should accept whitespace-only name (Zod default behavior)", () => {
			const result = goalSchema.safeParse({
				...validGoal,
				name: "   ",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("Validates name length", () => {
		it("should reject name over 100 characters", () => {
			const result = goalSchema.safeParse({
				...validGoal,
				name: "a".repeat(101),
			});
			expect(result.success).toBe(false);
		});

		it("should accept name with exactly 100 characters", () => {
			const result = goalSchema.safeParse({
				...validGoal,
				name: "a".repeat(100),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("Validates priority", () => {
		it("should accept all valid priorities", () => {
			const priorities = ["p1", "p2", "p3", "p4"];
			for (const priority of priorities) {
				const result = goalSchema.safeParse({
					...validGoal,
					priority,
				});
				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid priority", () => {
			const result = goalSchema.safeParse({
				...validGoal,
				priority: "p0",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Validates color format", () => {
		it("should accept valid hex color", () => {
			const result = goalSchema.safeParse({
				...validGoal,
				color: "#FF5733",
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid color format", () => {
			const result = goalSchema.safeParse({
				...validGoal,
				color: "red",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Validates dueDate", () => {
		it("should accept valid dueDate", () => {
			const result = goalSchema.safeParse({
				...validGoal,
				dueDate: new Date("2025-12-31"),
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid dueDate format", () => {
			const result = goalSchema.safeParse({
				...validGoal,
				dueDate: "not-a-date" as never,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Validates id field", () => {
		it("should reject non-uuid id", () => {
			const result = goalSchema.safeParse({
				...validGoal,
				id: "not-a-uuid",
			});
			expect(result.success).toBe(false);
		});
	});
});

describe("commentSchema Validation", () => {
	const validComment = {
		id: "550e8400-e29b-41d4-a716-446655440000",
		content: "Test comment content",
		postedAt: new Date(),
	};

	describe("Accepts valid comment", () => {
		it("should accept valid comment with all fields", () => {
			const result = commentSchema.safeParse(validComment);
			expect(result.success).toBe(true);
		});
	});

	describe("Validates content field", () => {
		it("should accept empty string content", () => {
			const result = commentSchema.safeParse({
				...validComment,
				content: "",
			});
			expect(result.success).toBe(true);
		});

		it("should accept long content", () => {
			const result = commentSchema.safeParse({
				...validComment,
				content: "a".repeat(10000),
			});
			expect(result.success).toBe(true);
		});
	});

	describe("Validates id field", () => {
		it("should reject non-uuid id", () => {
			const result = commentSchema.safeParse({
				...validComment,
				id: "not-a-uuid",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Validates postedAt field", () => {
		it("should reject invalid date format", () => {
			const result = commentSchema.safeParse({
				...validComment,
				postedAt: "not-a-date",
			});
			expect(result.success).toBe(false);
		});
	});
});

describe("createTaskSchema (API Route) Validation", () => {
	const validCreateTask = {
		title: "New Task",
		description: "Task description",
		completed: false,
		projectId: "550e8400-e29b-41d4-a716-446655440001",
		dueDate: "2025-12-31T00:00:00.000Z",
		planDate: "2025-12-25T00:00:00.000Z",
		priority: "p2",
		status: "todo",
		comments: [],
	};

	describe("Accepts valid task data", () => {
		it("should accept valid task with ISO date strings", () => {
			const result = createTaskSchema.safeParse(validCreateTask);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.dueDate).toBeInstanceOf(Date);
				expect(result.data.planDate).toBeInstanceOf(Date);
			}
		});

		it("should accept null projectId", () => {
			const result = createTaskSchema.safeParse({
				...validCreateTask,
				projectId: null,
			});
			expect(result.success).toBe(true);
		});

		it("should accept 'inbox' as projectId", () => {
			const result = createTaskSchema.safeParse({
				...validCreateTask,
				projectId: "inbox",
			});
			expect(result.success).toBe(true);
		});

		it("should accept empty string as projectId", () => {
			const result = createTaskSchema.safeParse({
				...validCreateTask,
				projectId: "",
			});
			expect(result.success).toBe(true);
		});

		it("should transform ISO string to Date", () => {
			const result = createTaskSchema.safeParse(validCreateTask);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.dueDate?.toISOString()).toBe(
					"2025-12-31T00:00:00.000Z",
				);
			}
		});

		it("should transform null dueDate correctly", () => {
			const result = createTaskSchema.safeParse({
				...validCreateTask,
				dueDate: null,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.dueDate).toBeNull();
			}
		});

		it("should transform undefined dueDate to null", () => {
			const { dueDate, ...taskWithoutDueDate } = validCreateTask;
			const result = createTaskSchema.safeParse(taskWithoutDueDate);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.dueDate).toBeNull();
			}
		});

		it("should omit optional fields correctly", () => {
			const minimalTask = {
				title: "Minimal Task",
				completed: false,
				priority: "p3",
				projectId: null,
			};
			const result = createTaskSchema.safeParse(minimalTask);
			expect(result.success).toBe(true);
		});
	});

	describe("Rejects invalid data", () => {
		it("should reject empty title", () => {
			const result = createTaskSchema.safeParse({
				...validCreateTask,
				title: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid UUID for projectId", () => {
			const result = createTaskSchema.safeParse({
				...validCreateTask,
				projectId: "not-a-uuid",
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid priority", () => {
			const result = createTaskSchema.safeParse({
				...validCreateTask,
				priority: "p0",
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid date string", () => {
			const result = createTaskSchema.safeParse({
				...validCreateTask,
				dueDate: "not-a-date",
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid status", () => {
			const result = createTaskSchema.safeParse({
				...validCreateTask,
				status: "invalid",
			});
			expect(result.success).toBe(false);
		});
	});
});
