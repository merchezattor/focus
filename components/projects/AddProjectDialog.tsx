"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { z } from 'zod';
import { type Goal, type Project } from '@/types';

const createProjectSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    viewType: z.enum(['list', 'board']).default('list'),
});

interface AddProjectDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    goals?: Goal[];
    projects?: Project[];
}

const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981",
    "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef",
    "#f43f5e", "#6b7280"
];

/**
 * Encode parentId + parentType into a single select value.
 * Format: "goal:<uuid>" or "project:<uuid>" or "none"
 */
function encodeParentValue(parentId?: string, parentType?: string): string {
    if (!parentId || !parentType) return "none";
    return `${parentType}:${parentId}`;
}

/**
 * Decode a composite select value back into parentId + parentType.
 */
function decodeParentValue(value: string): { parentId?: string; parentType?: 'goal' | 'project' } {
    if (value === "none") return {};
    const [type, ...idParts] = value.split(':');
    const id = idParts.join(':'); // handle UUIDs safely
    if (type === 'goal' || type === 'project') {
        return { parentId: id, parentType: type };
    }
    return {};
}

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
    const [viewType, setViewType] = useState('list');
    const [parentId, setParentId] = useState<string | undefined>(undefined);
    const [parentType, setParentType] = useState<'goal' | 'project' | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    // Sync state when opening with a project
    useEffect(() => {
        if (open) {
            if (projectToEdit) {
                setName(projectToEdit.name);
                setDescription(projectToEdit.description || '');
                setColor(projectToEdit.color);
                setViewType(projectToEdit.viewType || 'list');
                setParentId(projectToEdit.parentId || undefined);
                setParentType(projectToEdit.parentType || undefined);
            } else {
                // Reset for Add mode
                setName('');
                setDescription('');
                setColor(colors[Math.floor(Math.random() * colors.length)]);
                setViewType('list');
                setParentId(undefined);
                setParentType(undefined);
            }
        }
    }, [open, projectToEdit]);

    const handleParentChange = (value: string) => {
        const decoded = decodeParentValue(value);
        setParentId(decoded.parentId);
        setParentType(decoded.parentType);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = createProjectSchema.safeParse({ name, description, viewType });
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
                        viewType,
                        parentId: parentId || null,
                        parentType: parentType || null,
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
                        viewType,
                        parentId: parentId || null,
                        parentType: parentType || null,
                        isFavorite: false,
                    }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || 'Failed to create project');
                }
                const data = await res.json();

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

    // Filter out the project being edited to prevent self-reference
    const availableProjects = (props.projects || []).filter(p => p.id !== projectToEdit?.id);

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
                        <label className="text-sm font-medium">View</label>
                        <Select value={viewType} onValueChange={setViewType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select view" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="list">List</SelectItem>
                                <SelectItem value="board">Board (Kanban)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Parent</label>
                        <Select
                            value={encodeParentValue(parentId, parentType)}
                            onValueChange={handleParentChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select parent (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Parent</SelectItem>
                                {props.goals && props.goals.length > 0 && (
                                    <SelectGroup>
                                        <SelectLabel>Goals</SelectLabel>
                                        {props.goals.map(goal => (
                                            <SelectItem key={goal.id} value={`goal:${goal.id}`}>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: goal.color }}
                                                    />
                                                    {goal.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                )}
                                {availableProjects.length > 0 && (
                                    <SelectGroup>
                                        <SelectLabel>Projects</SelectLabel>
                                        {availableProjects.map(project => (
                                            <SelectItem key={project.id} value={`project:${project.id}`}>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: project.color }}
                                                    />
                                                    {project.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                )}
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
