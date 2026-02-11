"use client";

import { format } from "date-fns";
import {
	Activity,
	CheckCircle2,
	Circle,
	Edit,
	FilePlus,
	Trash2,
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

export function ActionItem({ action }: ActionItemProps) {
	const getIcon = () => {
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

	const getActorLabel = () => {
		return action.actorType === "agent" ? "AI Agent" : "User";
		// Ideally fetch user name if possible, but for mvp actorType is enough distinction
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
			className={`group flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-accent/50 transition-colors ${!action.isRead ? "bg-accent/10" : ""}`}
		>
			<div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="font-medium text-sm">{getActorLabel()}</span>
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
