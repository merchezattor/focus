import { Badge } from "@/components/ui/badge";

interface ProjectBadgeProps {
	name: string;
	color: string;
}

export function ProjectBadge({ name, color }: ProjectBadgeProps) {
	return (
		<Badge variant="secondary" className="text-xs gap-1">
			<span
				className={`w-2 h-2 rounded-full`}
				style={{ backgroundColor: color }}
			/>
			{name}
		</Badge>
	);
}
