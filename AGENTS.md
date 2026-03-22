# AGENTS.md

> **Purpose:** This file provides context, guidelines, and instructions for AI agents (and human developers) working on the **Focus** application. Read this first to understand the environment.

## 1. Project Overview

**Focus** is a modern productivity application (rebranded from "Todoist MVP"). It features task management, project organization, goal tracking, and a visual flow map.

### Core Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, Shadcn UI, Class Variance Authority (CVA)
- **Database:** PostgreSQL (Self-hosted via Dokploy), Drizzle ORM
- **Deployment:** Dokploy (VPS with Docker)
- **State Management:** Jotai (Global atoms)
- **Auth:** Better-Auth
- **Package Manager:** `bun`
- **Icons:** `lucide-react`, `@tabler/icons-react`

## 2. Architecture & "Mental Map"

The project uses a `src/` directory structure (deviation from Next.js default):

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # Authenticated layout group
│   │   ├── layout.tsx     # Main app layout with sidebar
│   │   ├── page.tsx       # Dashboard
│   │   └── ...            # Other routes
│   ├── (auth)/            # Auth routes (login)
│   └── api/               # API Route Handlers
├── components/
│   ├── ui/                # Shadcn UI primitives
│   ├── features/          # Domain components (tasks, projects, goals)
│   └── layout/            # Layout components (sidebar, header)
├── db/                    # Drizzle ORM
│   ├── schema.ts          # Database schema
│   └── index.ts           # DB connection
├── lib/                   # Utilities
│   ├── storage.ts         # Database CRUD operations
│   ├── atoms.ts           # Jotai global state
│   ├── auth.ts            # Better-Auth config
│   └── actions.ts         # Activity logging
├── actions/               # Server Actions (Next.js)
├── types/                 # TypeScript types
└── hooks/                 # Custom React hooks
```

## 3. Where to Look

| Task | Location | Notes |
|------|----------|-------|
| Add new page | `src/app/(main)/` | Use authenticated layout |
| API endpoint | `src/app/api/**/route.ts` | RESTful patterns |
| Database change | `src/db/schema.ts` | Run `bun run db:push` for local validation, then `bun run db:generate` to create a real Drizzle migration |
| New UI primitive | `src/components/ui/` | Use `bunx shadcn add <component>` |
| Feature component | `src/components/features/<domain>/` | Domain-organized |
| Global state | `src/lib/atoms.ts` | Jotai atoms |
| Server action | `src/actions/` | Colocated by domain |

## 4. Conventions

### Coding Style

- **Components:** Use `export function ComponentName` (avoid arrow functions for top-level components)
- **Type Safety:** Strict TypeScript. Define types in `@/types` or colocated
- **Imports:** Use absolute imports `@/...`
- **UI:** Use **Shadcn UI** components from `@/components/ui` whenever possible
- **State:** Use **Jotai** atoms for global UI state (Sidebar toggles, Dialog open states)

### Linting & Formatting

- **Linter/Formatter:** Biome
- **Rule:** After making ANY changes, run `bun run check` to verify and auto-fix
- **DO NOT** leave linting errors unresolved

### Database & Migrations

- **ORM:** Drizzle ORM with `postgres` driver (TCP-based)
- **Development:** Use `bun run db:push` for rapid prototyping
- **Required for schema changes:** After editing `src/db/schema.ts`, always generate a real migration with `bun run db:generate`
- **Do not stop at `db:push`:** `db:push` is only for local/dev schema sync and validation. It does **not** replace committed migration files.
- **Production:** Uses formal migrations from the `drizzle/` folder via `drizzle-kit migrate`
- **Production (Dokploy):** Migrations run automatically at **runtime** when container starts
- **Runtime migration script:** `scripts/migrate.mjs` - applies committed Drizzle migrations with retry logic (3 attempts)
- **Legacy script:** `scripts/manual-migrate.ts` is a one-off/manual helper, not the primary production migration path

### Icons

- Prefer **Lucide React** (`lucide-react`) for standard UI icons
- Use **Tabler Icons** (`@tabler/icons-react`) sparingly

## 5. Anti-Patterns (Forbidden)

- **DO NOT** modify `.git` or strictly internal configuration files unless asked
- **DO NOT** use `fs` or direct file system calls in client components (`"use client"`)
- **DO NOT** hallucinate routes; verify current route structure in `/app`
- **DO NOT** do something that you were not asked to do — always prefer to confirm with user

## 6. Commands

| Action | Command |
| :--- | :--- |
| **Start Dev Server** | `bun dev` |
| **Database Push (Dev)** | `bun run db:push` |
| **Database Migrate (Prod)** | `bun run db:migrate` |
| **Lint & Format (Check)** | `bun run check` |
| **Lint (Verify only)** | `bun run lint` |
| **Test** | `bun run test` |
| **Build** | `bun run build` |

## 7. Known "Gotchas"

- **Hydration Mismatches:** If you use random values (IDs, colors) in render, ensure they are stable (use `useEffect`) or suppress hydration warnings on specific elements if using Radix primitives
- **Sidebar Context:** The sidebar relies on `SidebarProvider`. Ensure any usage of sidebar hooks is within this context
- **Dialogs:** We use "Global" dialogs (`GlobalAddTaskDialog`, etc.) mounted in the layout to allow triggering from anywhere via Jotai atoms
- **Activity Log:** Actions (Create/Update/Delete) on Tasks, Projects, and Goals are **automatically logged**
  - **Agents:** If acting via API with a Bearer token, you are logged as `actorType: "agent"`
  - **Storage:** If using `lib/storage.ts` directly, ensure you pass the correct `actorType` ("user" or "agent")

---

## Subdirectory Knowledge Bases

- [`src/components/ui/`](src/components/ui/AGENTS.md) — Shadcn UI components
- [`src/lib/`](src/lib/AGENTS.md) — Utilities, storage, auth, state
- [`src/components/features/`](src/components/features/AGENTS.md) — Feature components
