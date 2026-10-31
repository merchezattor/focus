import { describe, expect, it } from "vitest";
import { createGoal, createProject } from "@/test/fixtures";
import { buildParentSections } from "../parentOptions";

describe("buildParentSections", () => {
	it("orders sections No Parent, Goals, Groups, then each status, and omits empty ones", () => {
		const sections = buildParentSections({
			goals: [createGoal({ id: "g1", name: "Goal" })],
			projects: [
				createProject({ id: "a", name: "Archived one", status: "archived" }),
				createProject({ id: "c", name: "Complete one", status: "complete" }),
				createProject({ id: "f", name: "Frozen one", status: "frozen" }),
				createProject({ id: "w", name: "Working one", status: "working" }),
				createProject({ id: "grp", name: "A group", kind: "group" }),
			],
		});

		expect(sections.map((s) => s.label)).toEqual([
			"No Parent",
			"Goals",
			"Groups",
			"Working projects",
			"Frozen projects",
			"Complete",
			"Archived",
		]);

		const onlyWorking = buildParentSections({
			goals: [],
			projects: [createProject({ id: "w", name: "W", status: "working" })],
		});
		expect(onlyWorking.map((s) => s.label)).toEqual([
			"No Parent",
			"Working projects",
		]);
	});

	it("sorts each section by name and puts every group in Groups whatever its status", () => {
		const sections = buildParentSections({
			goals: [
				createGoal({ id: "g2", name: "Zeta goal" }),
				createGoal({ id: "g1", name: "Alpha goal" }),
			],
			projects: [
				createProject({ id: "p2", name: "Beta", status: "working" }),
				createProject({ id: "p1", name: "Alpha", status: "working" }),
				createProject({
					id: "grp2",
					name: "Frozen group",
					kind: "group",
					status: "frozen",
				}),
				createProject({
					id: "grp1",
					name: "Archived group",
					kind: "group",
					status: "archived",
				}),
			],
		});

		const byLabel = Object.fromEntries(
			sections.map((s) => [s.label, s.options.map((o) => o.label)]),
		);
		expect(byLabel.Goals).toEqual(["Alpha goal", "Zeta goal"]);
		expect(byLabel.Groups).toEqual(["Archived group", "Frozen group"]);
		expect(byLabel["Working projects"]).toEqual(["Alpha", "Beta"]);
		expect(byLabel["Frozen projects"]).toBeUndefined();
		expect(byLabel.Archived).toBeUndefined();
	});

	it("hides the edited project and all its descendants, whatever their status or kind", () => {
		const projects = [
			createProject({ id: "root", name: "Root" }),
			createProject({ id: "child", name: "Child", parentProjectId: "root" }),
			createProject({
				id: "grandchild",
				name: "Grandchild",
				kind: "group",
				status: "archived",
				parentProjectId: "child",
			}),
			createProject({ id: "sibling", name: "Sibling" }),
			createProject({
				id: "other-child",
				name: "Other child",
				status: "frozen",
				parentProjectId: "sibling",
			}),
		];

		const values = buildParentSections({
			goals: [],
			projects,
			editingProjectId: "root",
		}).flatMap((s) => s.options.map((o) => o.value));

		expect(values).toEqual(["none", "project:sibling", "project:other-child"]);
	});
});
