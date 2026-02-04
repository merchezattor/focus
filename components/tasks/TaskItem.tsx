"use client";

import { format } from "date-fns";
import { MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  projectName?: string;
  projectColor?: string;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
}

export function TaskItem({
  task,
  projectName,
  projectColor,
  onToggle,
  onEdit,
}: TaskItemProps) {
  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all text-left",
        "hover:bg-accent/50 cursor-pointer",
        task.completed && "opacity-50"
      )}
      onClick={() => onEdit(task)}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={(checked) => onToggle(task.id, !!checked)}
        onClick={(e) => e.stopPropagation()}
        className="rounded-full w-5 h-5 border-2 transition-colors data-[state=checked]:border-none data-[state=checked]:text-white"
        style={{
          borderColor:
            task.priority === 'p1' ? '#ef4444' :
              task.priority === 'p2' ? '#f97316' :
                task.priority === 'p3' ? '#3b82f6' :
                  '#6b7280',
          backgroundColor: task.completed ? (
            task.priority === 'p1' ? '#ef4444' :
              task.priority === 'p2' ? '#f97316' :
                task.priority === 'p3' ? '#3b82f6' :
                  '#6b7280'
          ) : 'transparent'
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium line-clamp-1",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </span>
          {projectName && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: projectColor || "#e5e7eb",
                color: projectColor ? "white" : "inherit",
              }}
            >
              {projectName}
            </span>
          )}
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span className="text-xs">{task.comments.length}</span>
            </div>
          )}
        </div>
        <p className={cn("text-xs text-muted-foreground mt-0.5", !task.dueDate && "invisible")}>
          {task.dueDate ? `Due ${format(new Date(task.dueDate), "MMM d")}` : "No date"}
        </p>
      </div>
    </div>
  );
}
