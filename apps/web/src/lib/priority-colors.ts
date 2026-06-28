export const PRIORITY_COLORS = {
	p1: "#ef4444",
	p2: "#f97316",
	p3: "#3b82f6",
	p4: "#6b7280",
} as const;

export const PRIORITY_BG_CLASSES = {
	p1: "bg-red-500",
	p2: "bg-orange-500",
	p3: "bg-blue-500",
	p4: "bg-gray-500",
} as const;

export const PRIORITY_OPTIONS = [
	{ value: "p1" as const, label: "Priority 1", color: PRIORITY_COLORS.p1 },
	{ value: "p2" as const, label: "Priority 2", color: PRIORITY_COLORS.p2 },
	{ value: "p3" as const, label: "Priority 3", color: PRIORITY_COLORS.p3 },
	{ value: "p4" as const, label: "Priority 4", color: PRIORITY_COLORS.p4 },
];

export type Priority = keyof typeof PRIORITY_COLORS;
