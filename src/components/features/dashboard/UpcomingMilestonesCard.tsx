"use client";

import {
	differenceInCalendarDays,
	format,
	isToday,
	startOfDay,
} from "date-fns";
import { useSetAtom } from "jotai";
import { CalendarDays, Milestone as MilestoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isAddMilestoneOpenAtom, milestoneToEditAtom } from "@/lib/atoms";
import type { Milestone } from "@/types";

interface UpcomingMilestonesCardProps {
	milestones: Milestone[];
}

const MAX_VISIBLE_MILESTONES = 3;

function getBadgeClasses(daysLeft: number) {
	if (daysLeft < 100) {
		return {
			container: "border-orange-200 bg-orange-50 text-orange-900",
			label: "text-orange-700",
		};
	}

	if (daysLeft < 365) {
		return {
			container: "border-amber-200 bg-amber-50 text-amber-900",
			label: "text-amber-700",
		};
	}

	return {
		container: "border-sky-200 bg-sky-50 text-sky-900",
		label: "text-sky-700",
	};
}

function getUpcomingMilestones(milestones: Milestone[]) {
	const today = startOfDay(new Date());

	return milestones
		.filter(
			(milestone) =>
				differenceInCalendarDays(
					startOfDay(new Date(milestone.targetDate)),
					today,
				) >= 0,
		)
		.sort(
			(a, b) =>
				new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime(),
		)
		.slice(0, MAX_VISIBLE_MILESTONES);
}

function formatDaysLeft(targetDate: Date) {
	const daysLeft = differenceInCalendarDays(
		startOfDay(targetDate),
		startOfDay(new Date()),
	);

	return {
		value: daysLeft,
		label: daysLeft === 1 ? "day" : "days",
		isDueToday: isToday(targetDate),
	};
}

export function UpcomingMilestonesCard({
	milestones,
}: UpcomingMilestonesCardProps) {
	const setMilestoneToEdit = useSetAtom(milestoneToEditAtom);
	const setAddMilestoneOpen = useSetAtom(isAddMilestoneOpenAtom);
	const upcomingMilestones = getUpcomingMilestones(milestones);

	if (upcomingMilestones.length === 0) {
		return (
			<Card className="h-full">
				<CardContent className="flex h-full min-h-[220px] flex-col items-center justify-center gap-4 px-4 py-6 text-center">
					<div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-muted/40 text-muted-foreground">
						<MilestoneIcon className="h-5 w-5" />
					</div>
					<div className="space-y-1">
						<p className="text-sm font-medium">No upcoming milestones</p>
						<p className="text-xs text-muted-foreground">
							Add a milestone to keep the next major deadline visible here.
						</p>
					</div>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={() => setAddMilestoneOpen(true)}
					>
						Add milestone
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="h-full">
			<CardContent className="px-4 py-2">
				<div className="max-h-[280px] overflow-y-auto space-y-2">
					{upcomingMilestones.map((milestone) => {
						const { value, isDueToday } = formatDaysLeft(
							new Date(milestone.targetDate),
						);
						const badgeClasses = getBadgeClasses(value);

						return (
							<button
								type="button"
								key={milestone.id}
								onClick={() => setMilestoneToEdit(milestone)}
								className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
							>
								<div
									className={`flex min-h-10 min-w-10 flex-col items-center justify-center rounded-lg border px-1 ${badgeClasses.container}`}
								>
									<span className="text-[15px] font-semibold leading-none">
										{value}
									</span>
									<span
										className={`mt-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] ${badgeClasses.label}`}
									>
										{value === 1 ? "day" : "days"}
									</span>
								</div>

								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="line-clamp-1 flex-1 text-sm font-medium leading-tight">
											{milestone.title}
										</span>
										{isDueToday ? (
											<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800">
												Today
											</span>
										) : null}
									</div>

									<div className="mt-0.5 flex items-center gap-1.5 text-[11px] leading-tight text-muted-foreground">
										<CalendarDays className="h-3.5 w-3.5" />
										<span>
											{format(new Date(milestone.targetDate), "EEE, MMM d")}
										</span>
										{milestone.description ? (
											<>
												<span
													aria-hidden="true"
													className="text-muted-foreground/60"
												>
													•
												</span>
												<span className="line-clamp-1 min-w-0 flex-1">
													{milestone.description}
												</span>
											</>
										) : null}
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
