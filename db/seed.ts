
import { db } from './index';
import { projects, tasks, comments } from './schema';
import { readFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
    console.log('🌱 Seeding database from JSON files...');

    const processFile = (filename: string) => {
        try {
            const path = join(process.cwd(), 'data', filename);
            const data = readFileSync(path, 'utf-8');
            return JSON.parse(data);
        } catch (e) {
            console.warn(`Could not read ${filename}, returning empty array.`);
            return [];
        }
    };

    const tasksData = processFile('tasks.json');
    const projectsData = processFile('projects.json');

    console.log(`Found ${projectsData.length} projects and ${tasksData.length} tasks.`);

    // Seed Projects
    for (const p of projectsData) {
        await db.insert(projects).values({
            id: p.id,
            name: p.name,
            color: p.color,
            isFavorite: p.isFavorite,
            // Default dates if missing in JSON
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        }).onConflictDoNothing();
    }

    // Seed Tasks & Comments
    for (const t of tasksData) {
        // Insert Task
        await db.insert(tasks).values({
            id: t.id,
            content: t.title,
            description: t.description || null,
            completed: t.completed,
            priority: t.priority,
            project_id: t.projectId || null,
            due_date: t.dueDate ? new Date(t.dueDate) : null,
            plan_date: t.planDate ? new Date(t.planDate) : null,
            created_at: t.createdAt ? new Date(t.createdAt) : new Date(),
            updated_at: t.updatedAt ? new Date(t.updatedAt) : new Date(),
        }).onConflictDoNothing();

        // Insert Comments if any
        if (t.comments && Array.isArray(t.comments)) {
            for (const c of t.comments) {
                await db.insert(comments).values({
                    id: c.id,
                    content: c.content,
                    posted_at: c.postedAt ? new Date(c.postedAt) : new Date(),
                    task_id: t.id,
                }).onConflictDoNothing();
            }
        }
    }

    console.log('✅ Seeding complete!');
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
