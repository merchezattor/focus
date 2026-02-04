import { useMemo } from 'react';
import { format } from 'date-fns';
import type { Task } from '@/types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  projects: Map<string, { name: string; color: string }>;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  hideProjectName?: boolean;
}

export function TaskList({ tasks, projects, onToggle, onEdit, hideProjectName }: TaskListProps) {
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    const noDate: Task[] = [];

    tasks.filter(t => !t.completed).forEach(task => {
      if (!task.planDate) {
        noDate.push(task);
      } else {
        const dateKey = format(new Date(task.planDate), 'yyyy-MM-dd');
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(task);
      }
    });

    // Sort dates
    const sortedDates = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    return { dates: sortedDates, groups, noDate };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
            <path d="m9 16 2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Add your first task to start organizing your work and boost your productivity.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedTasks.dates.map(date => (
        <section key={date}>
          <h2 className="text-sm font-bold border-b pb-2 mb-4 px-1">
            {format(new Date(date), "d MMM")} <span className="text-muted-foreground font-normal">· {format(new Date(date), "EEEE")}</span>
          </h2>
          <div className="space-y-1">
            {groupedTasks.groups[date].map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onEdit={onEdit}
                projectColor={projects.get(task.projectId || '')?.color}
                projectName={hideProjectName ? undefined : projects.get(task.projectId || '')?.name}
              />
            ))}
          </div>
        </section>
      ))}

      {groupedTasks.noDate.length > 0 && (
        <section>
          <h2 className="text-sm font-bold border-b pb-2 mb-4 px-1">
            No date
          </h2>
          <div className="space-y-1">
            {groupedTasks.noDate.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onEdit={onEdit}
                projectColor={projects.get(task.projectId || '')?.color}
                projectName={hideProjectName ? undefined : projects.get(task.projectId || '')?.name}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
