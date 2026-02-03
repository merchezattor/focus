#!/bin/sh
set -e

echo "Starting deployment script..."

# Run migrations
echo "Running database migrations..."
bun run db/migrate.ts

# Start the application
echo "Starting application..."
exec bun server.js
