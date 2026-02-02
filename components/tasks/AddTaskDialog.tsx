import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Flag } from 'lucide-react';
import { toast } from 'sonner';
import type { Project } from '@/types';
import { z } from 'zod';

const priorities = [
  { value: 'p1', label: 'Priority 1', color: '#ef4444' }, // Red
  { value: 'p2', label: 'Priority 2', color: '#f97316' }, // Orange
  { value: 'p3', label: 'Priority 3', color: '#3b82f6' }, // Blue
  { value: 'p4', label: 'Priority 4', color: '#6b7280' }, // Grey
];

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  projectId: z.string().optional(),
  dueDate: z.string().optional(),
  planDate: z.string().optional(),
});

interface AddTaskDialogProps {
  projects: Project[];
  onTaskCreated: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AddTaskDialog({ projects, onTaskCreated, open: controlledOpen, onOpenChange, trigger }: AddTaskDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;
  const open = isOpen;
  const setOpen = setIsOpen;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [planDate, setPlanDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState('p4');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = createTaskSchema.safeParse({
      title,
      description: description || undefined,
      projectId: projectId || undefined,
      dueDate: dueDate?.toISOString(),
      planDate: planDate?.toISOString(),
    });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          projectId: projectId || null,
          dueDate: dueDate?.toISOString(),
          planDate: planDate?.toISOString(),
          completed: false,
          priority,
        }),
      });

      if (!res.ok) throw new Error('Failed to create task');

      toast.success('Task created successfully');
      setOpen(false);
      setTitle('');
      setDescription('');
      setProjectId('');
      setDueDate(undefined);
      setPlanDate(undefined);
      setPriority('p4');
      onTaskCreated();
      router.refresh();
    } catch (error) {
      toast.error('Failed to create task');
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ? (
            trigger
          ) : (
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add task
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Project</label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left ${!dueDate && 'text-muted-foreground'}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100]">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Plan Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left ${!planDate && 'text-muted-foreground'}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {planDate ? format(planDate, 'PPP') : 'Select plan date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100]">
                <Calendar
                  mode="single"
                  selected={planDate}
                  onSelect={setPlanDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4" style={{ color: priorities.find(p => p.value === priority)?.color }} />
                  {priorities.find(p => p.value === priority)?.label}
                </div>
              </SelectTrigger>
              <SelectContent className="z-[100]" position="popper">
                {priorities.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4" style={{ color: p.color }} />
                      {p.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isLoading ? 'Creating...' : 'Add Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
