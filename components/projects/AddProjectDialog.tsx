"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { z } from 'zod';
import { type Goal, type Project } from '@/types';

const createProjectSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
});

interface AddProjectDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    goals?: Goal[];
}

const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981",
    "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef",
    "#f43f5e", "#6b7280"
];

export function AddProjectDialog(props: AddProjectDialogProps & { projectToEdit?: Project | null }) {
    const { open: controlledOpen, onOpenChange, trigger, projectToEdit } = props;
    const router = useRouter();
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;
    const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;
    const open = isOpen;
    const setOpen = setIsOpen;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(colors[Math.floor(Math.random() * colors.length)]);
    const [type, setType] = useState('default');
    const [goalId, setGoalId] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    // Sync state when opening with a project
    useEffect(() => {
        if (open) {
            if (projectToEdit) {
                setName(projectToEdit.name);
                setDescription(projectToEdit.description || '');
                setColor(projectToEdit.color);
                setGoalId(projectToEdit.goalId || undefined);
            } else {
                // Reset for Add mode
                setName('');
                setDescription('');
                setColor(colors[Math.floor(Math.random() * colors.length)]);
                setGoalId(undefined);
            }
        }
    }, [open, projectToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = createProjectSchema.safeParse({ name, description });
        if (!result.success) {
            toast.error(result.error.issues[0].message);
            return;
        }

        setIsLoading(true);

        try {
            if (projectToEdit) {
                // Edit Mode
                const res = await fetch('/api/projects', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: projectToEdit.id,
                        name,
                        description,
                        color,
                        goalId: goalId || null,
                    }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || 'Failed to update project');
                }
                toast.success('Project updated successfully');
            } else {
                // Create Mode
                const res = await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        description,
                        color,
                        goalId: goalId || null,
                        isFavorite: false,
                    }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || 'Failed to create project');
                }
                const data = await res.json();

                // Only redirect on create? Or maybe on edit too?
                // Usually on edit we stay or just refresh. User might be on that project page.
                if (!projectToEdit) {
                    router.push(`/?project=${data.project.id}`);
                }
                toast.success('Project created successfully');
            }

            setOpen(false);
            router.refresh();

        } catch (error) {
            const msg = error instanceof Error ? error.message : 'An error occurred';
            toast.error(msg);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{projectToEdit ? 'Edit Project' : 'Add Project'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                            placeholder="Project name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            placeholder="Description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Goal</label>
                        <Select
                            value={goalId || "none"}
                            onValueChange={(val) => setGoalId(val === "none" ? undefined : val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select goal (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Goal</SelectItem>
                                {props.goals?.map(goal => (
                                    <SelectItem key={goal.id} value={goal.id}>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: goal.color }}
                                            />
                                            {goal.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Color</label>
                        <div className="flex flex-wrap gap-2">
                            {colors.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-primary' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>


                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!name.trim() || isLoading}>
                            {isLoading ? 'Saving...' : (projectToEdit ? 'Save' : 'Add Project')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
