import { atom } from "jotai";
import type { Task } from "@/types";

export const isAddTaskOpenAtom = atom(false);
export const isAddProjectOpenAtom = atom(false);
export const tasksAtom = atom<Task[]>([]);
