"use client"

import {
    CalendarBody,
    CalendarDate,
    CalendarDatePagination,
    CalendarDatePicker,
    CalendarHeader,
    CalendarItem,
    CalendarMonthPicker,
    CalendarProvider,
    CalendarYearPicker,
    type Feature,
} from "@/components/ui/calendar-full";
import type { Task } from "@/types";
import { useMemo } from "react";

const priorityColors = {
    p1: "#ef4444", // Red
    p2: "#f97316", // Orange
    p3: "#3b82f6", // Blue
    p4: "#6b7280", // Grey
};

export function UpcomingClient({ tasks }: { tasks: Task[] }) {
    const features: Feature[] = useMemo(() => {
        return tasks
            .filter((t) => !t.completed && (t.planDate || t.dueDate))
            .map((t) => ({
                id: t.id,
                name: t.title,
                startAt: new Date(t.planDate || t.dueDate!),
                endAt: new Date(t.planDate || t.dueDate!), // Calendar uses endAt for day placement
                status: {
                    id: t.priority,
                    name: t.priority,
                    color: priorityColors[t.priority as keyof typeof priorityColors] || "#6b7280",
                },
            }));
    }, [tasks]);

    return (
        <div className="h-full w-full flex flex-col">
            <CalendarProvider className="flex-1 border rounded-lg overflow-hidden bg-background shadow-sm">
                <CalendarDate>
                    <CalendarDatePicker>
                        <CalendarMonthPicker />
                        <CalendarYearPicker start={2024} end={2030} />
                    </CalendarDatePicker>
                    <CalendarDatePagination />
                </CalendarDate>
                <CalendarHeader />
                <CalendarBody features={features}>
                    {({ feature }) => <CalendarItem feature={feature} key={feature.id} />}
                </CalendarBody>
            </CalendarProvider>
        </div>
    );
}
