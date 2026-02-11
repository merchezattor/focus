# AGENTS.md

> **Purpose:** This file provides context, guidelines, and instructions for AI agents (and human developers) working on the **Focus** application. Read this first to understand the environment.

## 1. Project Overview

**Focus** is a modern productivity application (rebranded from "Todoist MVP"). It features task management, project organization, goal tracking, and a visual flow map.

### Core Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, Shadcn UI, Class Variance Authority (CVA)
- **Database:** PostgreSQL (Neon), Drizzle ORM
- **State Management:** Jotai (Global atoms)
- **Auth:** Better-Auth
- **Package Manager:** `bun`
- **Icons:** `lucide-react`, `@tabler/icons-react`

## 2. Architecture & "Mental Map"

The project structure follows standard Next.js App Router conventions:

- **`/app`**: Routes and Pages.
  - `(main)`: Authenticated routes (Layout, Map, Sidebar).
  - `/api`: API Route Handlers (Tasks, Projects, Goals).
- **`/components`**: React components.
  - `/ui`: Reusable Shadcn primitives (Button, Dialog, etc.).
  - `/projects`, `/tasks`, `/goals`: Feature-specific components.
  - `app-sidebar.tsx`: Main navigation sidebar.
- **`/db`**: Database configuration.
  - `schema.ts`: Drizzle schema definitions.
- **`/lib`**: Utilities.
  - `storage.ts`: Database access functions (CRUD).
  - `atoms.ts`: Jotai state atoms.
  - `auth.ts`: Auth configuration.
- **`/skills`**: MCP Skills integration (e.g., `focus-skill` for external agent interaction).

## 3. Development Conventions

### Coding Style

- **Components:** Use `export function ComponentName` (avoid arrow functions for top-level components).
- **Type Safety:** Strict TypeScript usage. Define types in `@/types` or colocated if specific.
- **Imports:** Use absolute imports `@/...`.
- **UI:** Use **Shadcn UI** components from `@/components/ui` whenever possible. Do not invent new UI primitives unless necessary.
- **State:** Use **Jotai** atoms for global UI state (Sidebar toggles, Dialog open states).

### Linting & Formatting (CRITICAL)

- **Linter/Formatter:** Biome.
- **Rule:** After making ANY changes, you **MUST** run the linter and fixer to ensure code quality and consistency.
  - Run `bun run check` to verify and auto-fix issues.
  - If issues persist, fix them manually. **DO NOT** leave linting errors unresolved.

### Database & Migrations

- **ORM:** Drizzle ORM.
- **Migration Workflow:**
  - **Local/Vercel:** Use `bun run db:migrate` (mapped to `drizzle-kit push`).
  - **Note:** We are currently using `push` for rapid MVP iteration. Do not use `generate/migrate` unless explicitly instructed to migrate to a formal migration flow.

### Icons

- Prefer **Lucide React** (`lucide-react`) for standard UI icons.
- Use **Tabler Icons** (`@tabler/icons-react`) sparingly if Lucide doesn't cover the case (historical usage).

## 4. Operational Commands

| Action | Command |
| :--- | :--- |
| **Start Dev Server** | `bun dev` |
| **Database Push** | `bun run db:migrate` |
| **Lint & Format (Check)** | `bun run check` |
| **Lint (Verify only)** | `bun run lint` |
| **Build** | `bun run build` |

## 5. Agent Directives (Do's & Don'ts)

- **DO** check `package.json` before installing new dependencies.
- **DO** use `task_boundary` to plan complex changes.
- **DO NOT** modify `.git` or strictly internal configuration files unless asked.
- **DO NOT** use `fs` or direct file system calls in client components ("use client").
- **DO NOT** hallucinate routes; verify current route structure in `/app`.
- **DO NOT** do somethink that you were not asked to do. Always prefer to confirm with user before starting implementation.

## 6. Known "Gotchas"

- **Hydration Mismatches:** If you use random values (IDs, colors) in render, ensure they are stable (use `useEffect`) or suppress hydration warnings on specific elements if using Radix primitives.
- **Sidebar Context:** The sidebar relies on `SidebarProvider`. Ensure any usage of sidebar hooks is within this context.
- **Dialogs:** We use "Global" dialogs (`GlobalAddTaskDialog`) mounted in the layout to allow triggering from anywhere via Jotai atoms.

---

### Last Updated: Feb 2026
