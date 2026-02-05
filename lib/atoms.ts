import { atom } from "jotai";
import type { Task, Project } from "@/types";

export const isAddTaskOpenAtom = atom(false);
export const isAddProjectOpenAtom = atom(false);
export const projectToEditAtom = atom<Project | null>(null);
export const tasksAtom = atom<Task[]>([]);
