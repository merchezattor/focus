import "dotenv/config";
import postgres from "postgres";

// Source: Neon database (current production)
const NEON_DATABASE_URL = process.env.NEON_DATABASE_URL;

// Target: Self-hosted Postgres (internal Docker)
const NEW_DATABASE_URL =
	process.env.NEW_DATABASE_URL || process.env.DATABASE_URL;

if (!NEON_DATABASE_URL) {
	console.error("Error: NEON_DATABASE_URL environment variable is required");
	process.exit(1);
}

if (!NEW_DATABASE_URL) {
	console.error(
		"Error: NEW_DATABASE_URL or DATABASE_URL environment variable is required",
	);
	process.exit(1);
}

async function migrate() {
	console.log(
		"🚀 Starting database migration from Neon to self-hosted Postgres...\n",
	);

	console.log("Connecting to source (Neon)...");
	const sourceSql = postgres(NEON_DATABASE_URL!, { max: 1 });

	console.log("Connecting to target (Self-hosted)...");
	const targetSql = postgres(NEW_DATABASE_URL!, { max: 1 });

	try {
		const tables = await sourceSql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

		console.log(`\n📋 Found ${tables.length} tables to migrate:`);
		for (const { table_name } of tables) {
			console.log(`   - ${table_name}`);
		}

		let totalRows = 0;

		for (const { table_name } of tables) {
			console.log(`\n🔄 Migrating table: ${table_name}`);

			const countResult = await sourceSql.unsafe(
				`SELECT COUNT(*) FROM "${table_name}"`,
			);
			const rowCount = Number.parseInt(countResult[0].count, 10);
			console.log(`   Found ${rowCount} rows`);

			if (rowCount === 0) {
				console.log(`   ✓ Skipped (empty table)`);
				continue;
			}

			const data = await sourceSql.unsafe(`SELECT * FROM "${table_name}"`);

			if (data.length === 0) continue;

			const columns = Object.keys(data[0]);
			const columnList = columns.map((c) => `"${c}"`).join(", ");

			const batchSize = 100;
			for (let i = 0; i < data.length; i += batchSize) {
				const batch = data.slice(i, i + batchSize);

				for (const row of batch) {
					const values = columns.map((col) => row[col]);
					const placeholders = values.map((_, idx) => `$${idx + 1}`).join(", ");

					await targetSql.unsafe(
						`INSERT INTO "${table_name}" (${columnList}) VALUES (${placeholders})`,
						values,
					);
				}

				process.stdout.write(
					`   Progress: ${Math.min(i + batchSize, data.length)}/${data.length}\r`,
				);
			}

			totalRows += data.length;
			console.log(`   ✓ Migrated ${data.length} rows`);
		}

		console.log(`\n✅ Migration complete! Total rows migrated: ${totalRows}`);

		console.log("\n📊 Verification:");
		for (const { table_name } of tables) {
			const sourceCount = await sourceSql.unsafe(
				`SELECT COUNT(*) FROM "${table_name}"`,
			);
			const targetCount = await targetSql.unsafe(
				`SELECT COUNT(*) FROM "${table_name}"`,
			);

			const sourceNum = Number.parseInt(sourceCount[0].count, 10);
			const targetNum = Number.parseInt(targetCount[0].count, 10);

			const status = sourceNum === targetNum ? "✓" : "✗";
			console.log(`   ${status} ${table_name}: ${sourceNum} → ${targetNum}`);
		}
	} catch (error) {
		console.error("\n❌ Migration failed:", error);
		process.exit(1);
	} finally {
		await sourceSql.end();
		await targetSql.end();
		console.log("\n🔌 Connections closed.");
	}
}

migrate();
