# syntax=docker/dockerfile:1
# ============================================================================
# Focus monorepo image — two build targets:
#   --target api  -> Node (bundled Hono server + Drizzle migrations)
#   --target web  -> Caddy serving the static SPA + reverse-proxying /api
# docker-compose builds both. Keep NODE_VERSION on the latest LTS.
# ============================================================================
ARG NODE_VERSION=24.13.0-slim

# ----------------------------------------------------------------------------
# Stage 1: install workspace dependencies (with dev deps, needed to build)
# ----------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
# Copy only manifests first for better layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ----------------------------------------------------------------------------
# Stage 2: build the API bundle and the web static assets
# ----------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS build
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN pnpm --filter @focus/api build && pnpm --filter @focus/web build
# tsup bundles @focus/core into the output, but every npm dependency stays
# external, so the API image needs a real node_modules. `deploy` resolves just
# the prod tree; the hoisted linker makes it a flat directory that COPY can
# lift out without dragging in the workspace's pnpm virtual store.
RUN pnpm --filter @focus/api --prod deploy --legacy \
    --config.node-linker=hoisted /prod/api

# ----------------------------------------------------------------------------
# Stage 3a: API runtime — bundled server, prod deps, and the migration SQL
# ----------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS api
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV RUN_MIGRATIONS=true
ENV MIGRATIONS_DIR=/app/drizzle
COPY --from=build --chown=node:node /app/apps/api/dist ./
COPY --from=build --chown=node:node /prod/api/node_modules ./node_modules
# Carries "type": "module", so node reads the bundle as ESM.
COPY --from=build --chown=node:node /prod/api/package.json ./package.json
COPY --from=build --chown=node:node /app/packages/core/drizzle ./drizzle
USER node
EXPOSE 3001
CMD ["node", "index.js"]

# ----------------------------------------------------------------------------
# Stage 3b: Web runtime — Caddy serves the SPA and reverse-proxies /api
# ----------------------------------------------------------------------------
FROM caddy:2-alpine AS web
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/web/dist /srv/web
EXPOSE 80
