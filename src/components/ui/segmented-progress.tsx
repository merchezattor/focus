import { cn } from "@/lib/utils";

export interface SegmentedProgressProps {
	done: number;
	inProgress: number;
	backlog: number;
	className?: string;
	showLegend?: boolean;
}

export function SegmentedProgress({
	done,
	inProgress,
	backlog,
	className,
	showLegend = false,
}: SegmentedProgressProps) {
	const total = done + inProgress + backlog;

	const donePercent = total > 0 ? (done / total) * 100 : 0;
	const inProgressPercent = total > 0 ? (inProgress / total) * 100 : 0;
	const backlogPercent = total > 0 ? (backlog / total) * 100 : 0;

	return (
		<div
			className={cn("w-full", className)}
			role="progressbar"
			aria-label="Task progress breakdown"
			aria-valuenow={total}
			aria-valuemin={0}
			aria-valuemax={total > 0 ? total : 1}
		>
			<div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-muted">
				{donePercent > 0 && (
					<div
						className="bg-green-500 transition-all duration-300"
						style={{ width: `${donePercent}%` }}
					/>
				)}
				{inProgressPercent > 0 && (
					<div
						className="bg-amber-500 transition-all duration-300"
						style={{ width: `${inProgressPercent}%` }}
					/>
				)}
				{backlogPercent > 0 && (
					<div
						className="bg-blue-500 transition-all duration-300"
						style={{ width: `${backlogPercent}%` }}
					/>
				)}
			</div>
			{showLegend && (
				<div className="flex gap-3 text-xs mt-2 text-muted-foreground">
					<span className="flex items-center gap-1">
						<span className="w-2 h-2 rounded-full bg-green-500" />
						Done ({done})
					</span>
					<span className="flex items-center gap-1">
						<span className="w-2 h-2 rounded-full bg-amber-500" />
						In Progress ({inProgress})
					</span>
					<span className="flex items-center gap-1">
						<span className="w-2 h-2 rounded-full bg-blue-500" />
						Backlog ({backlog})
					</span>
				</div>
			)}
		</div>
	);
}
