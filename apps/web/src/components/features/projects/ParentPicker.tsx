"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Goal, Project } from "@/types";
import { buildParentSections } from "./parentOptions";

interface ParentPickerProps {
	/** Encoded value: "none" | "goal:<uuid>" | "project:<uuid>" */
	value: string;
	onValueChange: (value: string) => void;
	goals?: Goal[];
	projects?: Project[];
	/** The project being edited. It and its descendants cannot be its parent. */
	editingProjectId?: string;
}

// Stable defaults so the memos below don't recompute on every render.
const NO_GOALS: Goal[] = [];
const NO_PROJECTS: Project[] = [];

/** Match on the option's name only, not on its encoded value. */
function matchByName(_value: string, search: string, keywords?: string[]) {
	const haystack = (keywords ?? []).join(" ").toLowerCase();
	return haystack.includes(search.trim().toLowerCase()) ? 1 : 0;
}

export function ParentPicker({
	value,
	onValueChange,
	goals = NO_GOALS,
	projects = NO_PROJECTS,
	editingProjectId,
}: ParentPickerProps) {
	const [open, setOpen] = useState(false);

	const sections = useMemo(
		() => buildParentSections({ goals, projects, editingProjectId }),
		[goals, projects, editingProjectId],
	);

	// Look the selection up in the full lists, so a parent that sits in a lower
	// section (or is otherwise not offered) still displays.
	const selectedLabel = useMemo(() => {
		if (value === "none") return "No Parent";
		const [type, ...rest] = value.split(":");
		const id = rest.join(":");
		if (type === "goal") return goals.find((g) => g.id === id)?.name;
		if (type === "project") return projects.find((p) => p.id === id)?.name;
		return undefined;
	}, [value, goals, projects]);

	return (
		// modal: the picker renders inside the Add/Edit Project Dialog, whose
		// scroll lock cancels wheel/touch events on portaled content outside the
		// dialog. A modal Popover takes its own scroll lock, so the list can scroll.
		<Popover open={open} onOpenChange={setOpen} modal>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					role="combobox"
					aria-label="Parent"
					aria-expanded={open}
					className="w-full justify-between font-normal"
				>
					<span className="truncate">
						{selectedLabel ?? "Select parent (optional)"}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-(--radix-popover-trigger-width) p-0"
			>
				<Command filter={matchByName}>
					<CommandInput placeholder="Search parent..." />
					<CommandList>
						<CommandEmpty>No parent found.</CommandEmpty>
						{sections.map((section) => (
							<CommandGroup
								key={section.label}
								heading={
									section.label === "No Parent" ? undefined : section.label
								}
							>
								{section.options.map((option) => (
									<CommandItem
										key={option.value}
										value={option.value}
										keywords={[option.label]}
										onSelect={() => {
											onValueChange(option.value);
											setOpen(false);
										}}
									>
										{option.color && (
											<span
												className="h-2 w-2 shrink-0 rounded-full"
												style={{ backgroundColor: option.color }}
											/>
										)}
										<span className="truncate">{option.label}</span>
										<Check
											className={cn(
												"ml-auto",
												value === option.value ? "opacity-100" : "opacity-0",
											)}
										/>
									</CommandItem>
								))}
							</CommandGroup>
						))}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
