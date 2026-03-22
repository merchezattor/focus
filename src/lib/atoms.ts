import { atom } from "jotai";
import type { Goal, Project, Task } from "@/types";

export const isAddTaskOpenAtom = atom(false);
export const isAddProjectOpenAtom = atom(false);
export const projectToEditAtom = atom<Project | null>(null);
export const goalToEditAtom = atom<Goal | null>(null);
export const tasksAtom = atom<Task[]>([]);
export const refreshBacklogAtom = atom(0);
export const refreshCompletedAtom = atom(0);
