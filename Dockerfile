# syntax=docker/dockerfile:1

# ========================================
# Stage 1: Dependencies
# ========================================
FROM oven/bun:1-alpine AS deps

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ========================================
# Stage 2: Builder
# ========================================
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY . .

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Accept DATABASE_URL as build argument (required for static generation)
ARG DATABASE_URL

# Build the application
RUN bun run build

# ========================================
# Stage 3: Production Runner
# ========================================
FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs --ingroup nodejs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy migrations and dependencies for runtime migrations
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))" || exit 1

CMD ["node", "scripts/migrate.mjs", "&&", "node", "server.js"]
