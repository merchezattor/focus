# NeonDB to Self-Hosted Postgres Migration Guide

This guide documents how to migrate the Focus application from NeonDB (cloud PostgreSQL) to self-hosted PostgreSQL running in Dokploy.

## Overview

The migration involves:
1. Deploying code changes (driver swap from Neon to standard postgres)
2. Creating schema in new database
3. Migrating data from Neon to self-hosted Postgres
4. Switching environment variables to point to new database

## Prerequisites

- Access to both NeonDB and new self-hosted Postgres
- VPS with Dokploy configured
- Connection strings for both databases

## Migration Steps

### Step 1: Prepare Environment Variables

On your local machine, create a `.env.migration` file with both database connections:

```bash
# Source (Neon - current production)
NEON_DATABASE_URL=postgresql://user:pass@neon-host.neon.tech/dbname

# Target (Self-hosted - new)
NEW_DATABASE_URL=postgresql://user:pass@postgres:5432/dbname
```

### Step 2: Deploy Application to VPS

Deploy the updated code to Dokploy (this code still points to Neon):

1. Push your changes to the repository
2. Dokploy will auto-deploy or trigger manual deploy
3. Verify the application still works (still using Neon)

### Step 3: Set Up New PostgreSQL in Dokploy

1. Ensure PostgreSQL service is running in Dokploy dashboard
2. Note the internal hostname (usually `postgres` or the service name you configured)
3. Verify credentials match what you plan to use

### Step 4: Apply Schema to New Database

SSH into your VPS:

```bash
ssh user@your-vps-ip
```

Navigate to the application directory and run schema migration:

```bash
cd /path/to/your/app
export DATABASE_URL=postgresql://user:pass@postgres:5432/dbname
bun run db:migrate
```

This creates all tables defined in `src/db/schema.ts` in the new database.

### Step 5: Migrate Data

#### Option A: Using the TypeScript Migration Script (Recommended)

This script migrates data directly from Neon to your new Postgres:

```bash
# On VPS, set both environment variables
export NEON_DATABASE_URL=postgresql://neon-user:neon-pass@neon-host.neon.tech/dbname
export NEW_DATABASE_URL=postgresql://user:pass@postgres:5432/dbname

# Run the migration
bun run scripts/migrate-neon-to-postgres.ts
```

The script will:
- Connect to both databases
- List all tables in the source
- Migrate data table by table
- Show progress and row counts
- Verify counts match at the end

#### Option B: Using pg_dump and pg_restore

If you prefer standard PostgreSQL tools:

```bash
# On local machine, export from Neon
pg_dump \
  --dbname="postgresql://neon-user:neon-pass@neon-host.neon.tech/dbname" \
  --format=custom \
  --file=backup.dump

# Copy to VPS
scp backup.dump user@your-vps-ip:/tmp/

# On VPS, restore to new database
docker exec -i your-postgres-container pg_restore \
  --dbname="postgresql://user:pass@localhost:5432/dbname" \
  --verbose \
  /tmp/backup.dump
```

### Step 6: Verify Data Migration

Check that row counts match between source and target:

```bash
# On VPS, connect to new database and count rows
docker exec your-postgres-container psql \
  "postgresql://user:pass@localhost:5432/dbname" \
  -c "SELECT 'user' as table_name, COUNT(*) FROM user 
      UNION ALL 
      SELECT 'tasks', COUNT(*) FROM tasks 
      UNION ALL 
      SELECT 'projects', COUNT(*) FROM projects;"
```

Compare with Neon to ensure they match.

### Step 7: Switch Application to New Database

In Dokploy dashboard:

1. Update the `DATABASE_URL` environment variable:
   ```
   postgresql://user:pass@postgres:5432/dbname
   ```
   (Use your actual credentials and database name)

2. Remove `DATABASE_URL_UNPOOLED` if it exists (no longer needed)

3. Trigger a redeploy

### Step 8: Verify Application

1. Open the application in your browser
2. Log in with existing user credentials
3. Create a test task or project
4. Refresh the page to verify data persists
5. Check that all existing data is visible

### Step 9: Monitor for Issues

Watch application logs in Dokploy for any database connection errors:

- Connection refused: Check Postgres container is running
- Authentication failed: Verify credentials
- Missing tables: Re-run schema migration

## Rollback Plan

If issues occur:

1. In Dokploy dashboard, revert `DATABASE_URL` back to Neon connection string
2. Redeploy the application
3. System is back to original state

Neon database remains intact until you explicitly delete it, so rollback is always possible.

## Post-Migration Cleanup

After confirming everything works for 24-48 hours:

1. Delete Neon database (if desired) to stop billing
2. Remove migration scripts if no longer needed
3. Update this documentation with any lessons learned

## Troubleshooting

### Connection Refused Error

- Verify Postgres container is running: `docker ps | grep postgres`
- Check internal hostname is correct (usually `postgres`)
- Ensure both services are on the same Docker network in Dokploy

### Missing Data After Migration

- Re-run the migration script
- Check script output for errors
- Verify table schemas match between source and target
- Some tables may be empty (this is normal)

### Permission Errors

- Ensure database user has proper permissions (CREATE, INSERT, SELECT)
- Check schema ownership in new database
- Verify user can connect from the application container

### Authentication Issues

- Double-check username and password in connection string
- Ensure special characters in password are URL-encoded
- Verify the database name is correct

## Code Changes Summary

The following changes were made to support self-hosted Postgres:

1. **Driver swap** (`src/db/index.ts`):
   - Changed from `@neondatabase/serverless` to `postgres`
   - Changed from `drizzle-orm/neon-http` to `drizzle-orm/postgres-js`

2. **Migration scripts** (`scripts/migrate-parent.ts`):
   - Updated to use standard `postgres` driver

3. **Dependencies** (`package.json`):
   - Removed `@neondatabase/serverless`

4. **New migration script** (`scripts/migrate-neon-to-postgres.ts`):
   - Created to migrate data between databases

## Support

If you encounter issues not covered here:

1. Check application logs in Dokploy
2. Verify environment variables are set correctly
3. Test database connectivity from the VPS
4. Review the migration script output for specific errors
