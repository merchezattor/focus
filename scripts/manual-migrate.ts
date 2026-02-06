import 'dotenv/config';
import postgres from 'postgres';

async function main() {
    console.log("Connecting to DB...");
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set");
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL);

    try {
        console.log("Adding view_type to projects...");
        await sql`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS view_type text DEFAULT 'list' NOT NULL;
        `;
        console.log("Added view_type.");

        console.log("Adding status to tasks...");
        await sql`
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS status text DEFAULT 'todo' NOT NULL;
        `;
        console.log("Added status.");

        console.log("Manual migration complete.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await sql.end();
    }
}

main();
