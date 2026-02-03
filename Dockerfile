
FROM oven/bun:1 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables must be present at build time
# We can pass them as args or just let Next build (it might need them)
ENV NEXT_TELEMETRY_DISABLED 1

RUN bun run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Check if groupadd/useradd is available, otherwise allow fallback or just use what works in debian-slim
# oven/bun:1 is based on debian-slim which has useradd/groupadd but not adduser/addgroup by default
RUN groupadd -g 1001 -r nodejs
RUN useradd -u 1001 -r -g nodejs -s /bin/false nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/package.json ./package.json

# Install production dependencies to ensure migration scripts work
# (Standalone build might miss files needed for scripts outside the Next.js app)
COPY --from=deps /app/bun.lockb ./bun.lockb
RUN bun install --production

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy migrations and scripts
COPY --chown=nextjs:nodejs drizzle ./drizzle
COPY --chown=nextjs:nodejs db/migrate.ts ./db/migrate.ts
COPY --chown=nextjs:nodejs start.sh ./start.sh
COPY --chown=nextjs:nodejs db ./db
COPY --chown=nextjs:nodejs drizzle.config.ts ./drizzle.config.ts

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

CMD ["./start.sh"]
