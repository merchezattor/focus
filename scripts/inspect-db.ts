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
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'projects';
        `;

        console.log("Columns in 'projects' table:");
        console.table(columns);
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

main();
