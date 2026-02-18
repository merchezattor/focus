"use client";
import { format } from "date-fns";
import {
	Activity,
	AlignLeft,
	Bot,
	Calendar,
	CheckCircle2,
	Circle,
	Edit,
	FilePlus,
	Flag,
	MessageSquare,
	Trash2,
	Type,
	User,
} from "lucide-react";
import Link from "next/link";
import type { ActionType, ActorType, EntityType } from "@/lib/actions";

interface ActionItemProps {
	action: {
		id: string;
		entityId: string;
		entityType: EntityType;
		actorId: string;
		actorType: ActorType;
		actionType: ActionType;
		changes: any;
		metadata: any;
		createdAt: Date;
		isRead: boolean;
	};
}

const PRIORITIES = {
	p1: { label: "Priority 1", color: "#ef4444" },
	p2: { label: "Priority 2", color: "#f97316" },
	p3: { label: "Priority 3", color: "#3b82f6" },
	p4: { label: "Priority 4", color: "#6b7280" },
};

export function ActionItem({ action }: ActionItemProps) {
	const getIcon = () => {
		if (action.actionType === "update" && action.changes) {
			if (action.changes.priority) {
				const priority = action.changes.priority as keyof typeof PRIORITIES;
				const color = PRIORITIES[priority]?.color || "#6b7280";
				return <Flag className="h-4 w-4" style={{ color, fill: "none" }} />;
			}
			if (action.changes.comments) {
				return <MessageSquare className="h-4 w-4 text-purple-500" />;
			}
			if (action.changes.description) {
				return <AlignLeft className="h-4 w-4 text-gray-500" />;
			}
			if (action.changes.dueDate) {
				return <Calendar className="h-4 w-4 text-orange-500" />;
			}
			if (action.changes.planDate) {
				return <Calendar className="h-4 w-4 text-yellow-500" />;
			}
			if (action.changes.title) {
				return <Type className="h-4 w-4 text-blue-500" />;
			}
		}

		// Fallback to default action icons
		switch (action.actionType) {
			case "create":
				return <FilePlus className="h-4 w-4 text-green-500" />;
			case "update":
				return <Edit className="h-4 w-4 text-blue-500" />;
			case "delete":
				return <Trash2 className="h-4 w-4 text-red-500" />;
			case "complete":
				return <CheckCircle2 className="h-4 w-4 text-green-600" />;
			case "uncomplete":
				return <Circle className="h-4 w-4 text-gray-500" />;
			default:
				return <Activity className="h-4 w-4 text-gray-400" />;
		}
	};

	const getActorDisplay = () => {
		if (action.actorType === "agent") {
			const tokenName = action.metadata?.tokenName;
			return (
				<div className="flex items-center gap-1.5">
					<Bot className="h-4 w-4 text-muted-foreground" />
					{tokenName && (
						<span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
							{tokenName}
						</span>
					)}
				</div>
			);
		}
		return <User className="h-4 w-4 text-muted-foreground" />;
	};

	const getDescription = () => {
		const typeLabel =
			action.entityType.charAt(0).toUpperCase() + action.entityType.slice(1);

		const name = action.metadata?.name || action.metadata?.title;
		const entityLabel = name ? `${typeLabel} "${name}"` : typeLabel;

		// Generate Link URL
		let href = "";
		if (action.entityType === "project") {
			href = `/project/${action.entityId}`;
		} else if (action.entityType === "goal") {
			href = "/goals";
		} else if (action.entityType === "task") {
			href = `/?taskId=${action.entityId}`;
		}

		// Helper to wrap content in Link if href exists
		const wrapLink = (content: React.ReactNode) => {
			if (!href) return content;
			return (
				<Link
					href={href}
					className="font-medium hover:underline hover:text-primary transition-colors"
				>
					{content}
				</Link>
			);
		};

		const content = (() => {
			if (action.actionType === "update" && action.changes) {
				if (action.changes.priority) {
					return <>Changed priority of {wrapLink(entityLabel)}</>;
				}
				if (action.changes.comments) {
					// Check if added or removed by comparing lengths or checking metadata?
					// For MVP assume added if present in changes
					return <>Commented on {wrapLink(entityLabel)}</>;
				}
				if (action.changes.description) {
					return <>Updated description of {wrapLink(entityLabel)}</>;
				}
				if (action.changes.dueDate) {
					return <>Changed due date of {wrapLink(entityLabel)}</>;
				}
				if (action.changes.planDate) {
					return <>Changed planned date of {wrapLink(entityLabel)}</>;
				}
				if (action.changes.title) {
					return <>Renamed {wrapLink(entityLabel)}</>;
				}
			}

			switch (action.actionType) {
				case "create":
					return <>Created {wrapLink(entityLabel)}</>;
				case "update": {
					const keys = action.changes
						? Object.keys(action.changes).join(", ")
						: "properties";
					return (
						<>
							Updated {wrapLink(entityLabel)} ({keys})
						</>
					);
				}
				case "delete":
					return `Deleted ${entityLabel}`; // Cannot link to deleted item
				case "complete":
					return <>Completed {wrapLink(entityLabel)}</>;
				case "uncomplete":
					return <>Uncompleted {wrapLink(entityLabel)}</>;
				default:
					return <>Acted on {wrapLink(entityLabel)}</>;
			}
		})();

		return content;
	};

	return (
		<div
			className={`group flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-accent/50 transition-colors ${
				action.isRead === false
					? "bg-accent/10"
					: "opacity-60 hover:opacity-100"
			}`}
		>
			<div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span title={action.actorType === "agent" ? "AI Agent" : "User"}>
						{getActorDisplay()}
					</span>
					<span className="text-muted-foreground text-xs">•</span>

					<span className="text-sm text-foreground/90">{getDescription()}</span>
				</div>
				{action.actionType === "update" && action.changes && (
					<div className="text-xs text-muted-foreground mt-0.5 truncate">
						{JSON.stringify(action.changes)}
					</div>
				)}
			</div>
			<div className="text-xs text-muted-foreground whitespace-nowrap">
				{format(new Date(action.createdAt), "MMM d, h:mm a")}
			</div>
		</div>
	);
}
