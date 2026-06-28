import { atom } from "jotai";
import type { Goal, Milestone, Project, Task } from "@/types";

export const isAddTaskOpenAtom = atom(false);
export const isAddProjectOpenAtom = atom(false);
export const isAddMilestoneOpenAtom = atom(false);
export const projectToEditAtom = atom<Project | null>(null);
export const goalToEditAtom = atom<Goal | null>(null);
export const milestoneToEditAtom = atom<Milestone | null>(null);
export const tasksAtom = atom<Task[]>([]);
export const refreshBacklogAtom = atom(0);
export const refreshCompletedAtom = atom(0);
export const isAddGoalOpenAtom = atom(false);
