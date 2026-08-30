# Deployment

Focus self-hosts as three containers on one host: PostgreSQL, the Hono API, and
Caddy serving the React SPA. Everything is built from source in this repo — there
is no registry image and no PaaS involved.

## Architecture

```
client ──> reverse proxy (TLS) ──> 127.0.0.1:3077 ──> web (Caddy)
                                                       ├── /api/*  ──> api (Hono :3001)
                                                       └── /*      ──> SPA static files
                                                                          │
                                                                    db (Postgres :5432,
                                                                     compose network only)
```

The SPA and the API share a **single origin**. That is the whole point of putting
Caddy in front: the better-auth session cookie stays first-party, so the frontend
needs no CORS, no API base URL, and no build-time public env var.

`Dockerfile` is multi-stage with two runtime targets, both built by compose:

| Target | Base | Contents |
|---|---|---|
| `api` | `node:24-slim` | tsup-bundled Hono server + the `drizzle/` SQL migrations |
| `web` | `caddy:2-alpine` | `Caddyfile` + the built SPA in `/srv/web` |

`@focus/core` ships as TypeScript source and is bundled into the API by tsup
(`noExternal`), so the API image carries no `node_modules` at all.

**Building with `--target` is required.** A plain `docker build .` with no target
produces the *last* stage — a Caddy image with no application in it.

### Migrations

The API image sets `RUN_MIGRATIONS=true`, so `apps/api/src/index.ts` calls
`runMigrations()` (`apps/api/src/migrate.ts`) before the server starts, applying
everything in `MIGRATIONS_DIR` (`/app/drizzle`). Compose gates `api` on the
database healthcheck and `web` on the API healthcheck, so a cold `up` orders
itself: db ready → migrations → API listening → Caddy accepting traffic.

Local development migrates separately with `pnpm db:migrate`.

## Deploying

```bash
# 1. Secrets (compose loads .env automatically)
cp .env.docker.example .env
chmod 600 .env
```

Set at minimum:

- `POSTGRES_PASSWORD` — **must be URL-safe**; it is interpolated verbatim into
  `DATABASE_URL`, so `@ / : # ?` break it. Use `openssl rand -hex 32`.
- `BETTER_AUTH_SECRET` — `openssl rand -base64 32`.
- `BETTER_AUTH_BASE_URL` — the origin users actually reach. An `https://` value
  turns on `Secure` cookies automatically; an `http://` one leaves them off so
  plain-LAN access still works.
- `APP_PORT` / `APP_BIND` — host port and interface. Keep the bind on loopback.

```bash
# 2. Build and start
docker compose up --build -d

# 3. Watch the first boot apply migrations
docker compose logs -f api
```

## Verifying

```bash
docker compose ps                                   # all three healthy
curl -fsS http://127.0.0.1:3077/api/health          # {"status":"ok"}
curl -fsS http://127.0.0.1:3077/ | head             # SPA HTML
ss -lntH | grep 3077                                # bound to 127.0.0.1 only
docker compose exec db psql -U focus -d focus -c '\dt'
```

Then open the app, register the first account, and create a task. A session that
survives a reload confirms `BETTER_AUTH_BASE_URL`, the cookie's `Secure` flag,
and `trustedOrigins` all agree.

## Remote access

Publish through a TLS-terminating reverse proxy rather than widening `APP_BIND`.
With Tailscale, a tailnet-only service needs no certificate management:

```bash
tailscale serve --service=svc:focus --https=443 http://127.0.0.1:3077
```

Then set `BETTER_AUTH_BASE_URL=https://focus.<your-tailnet>.ts.net` and recreate
the API container so it picks the value up.

## Updating

```bash
git pull
docker compose up --build -d
```

Pending migrations apply on API start. Before an update that changes the schema,
snapshot the database — `pgdata` is the only copy:

```bash
docker compose exec -T db pg_dump -U focus focus | gzip > focus-$(date +%F).sql.gz
```

Restoring: `gunzip -c focus-YYYY-MM-DD.sql.gz | docker compose exec -T db psql -U focus -d focus`.

## Operational notes

- `docker compose down` stops the stack and keeps the data. **Never `down -v`** —
  that deletes the `pgdata` volume.
- Only `web` publishes a host port. The API is reachable only through Caddy, and
  the database only from the API.
- Google OAuth is optional: leave `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
  blank and the provider is not registered, leaving email + password.
- Container logs are capped at 3 × 10 MB per service.

## Troubleshooting

| Symptom | Cause |
|---|---|
| API restart-loops on `DATABASE_URL is not set` or an auth failure | `POSTGRES_PASSWORD` contains a URL-reserved character, or was changed after the volume was initialized |
| Logged out on every reload | `BETTER_AUTH_BASE_URL` scheme/host doesn't match the URL in the browser |
| `bind: address already in use` | `APP_PORT` is taken; pick another |
| SPA loads but every request 502s | API unhealthy — check `docker compose logs api` for a failed migration |
| Deep links 404 | Caddy's `try_files` fallback in `Caddyfile` was modified |
