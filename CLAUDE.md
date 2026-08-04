# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This is an early-stage CRM monorepo with two independent, unlinked npm packages: `client/` (built out) and `server/` (a stub). [instructions.md](instructions.md) at the repo root is the *original spec/prompt* used to scaffold this project — it describes an ambitious target architecture (Mongoose/MongoDB, JWT auth, deals pipeline, email integration, analytics, etc.) that is **mostly not yet implemented**. Treat it as a design reference for intended direction, not as documentation of current code. Check actual files before assuming any described feature exists.

Current actual state:
- `server/` is just a bare Express 5 app ([server/index.js](server/index.js)) with `morgan` logging and a single `/` route. No TypeScript, no database, no auth, no routes/controllers/models yet, despite the spec describing all of these.
- `client/` is a real Vite + React 19 + TypeScript app with routing, layout, and several pages, but pages currently use **hardcoded dummy data** (see `INITIAL_TASKS` in [Tasks.tsx](client/src/pages/Tasks.tsx), `INITIAL_CONTACTS` in [Contacts.tsx](client/src/pages/Contacts.tsx)) — there is no API client, no data fetching layer, and no TanStack Query/Zustand/Axios wired up yet, even though they appear as intended dependencies in the spec.
- Root `package.json`/`package-lock.json` were removed (see git status) — there is no root-level workspace tooling; each of `client/` and `server/` is managed independently.

## Commands

All commands are run from within `client/` or `server/` respectively — there is no root script runner.

### Client (`client/`)
```bash
npm run dev         # start Vite dev server
npm run build        # tsc -b && vite build
npm run lint          # eslint .
npm run format        # prettier --write "**/*.{ts,tsx}"
npm run typecheck     # tsc --noEmit
npm run preview       # preview production build
```
No test runner is configured yet.

To add a shadcn/ui component:
```bash
npx shadcn@latest add <component>
```
This places new components under `client/src/components/ui`.

### Server (`server/`)
```bash
npm run dev    # nodemon index.js
```
`npm test` is a placeholder (`exit 1`) — no tests exist for the server.

## Architecture

### Client structure
- Routing is defined centrally in [App.tsx](client/src/App.tsx) using `react-router` v7, wrapped in a single [Layout.tsx](client/src/layout/Layout.tsx) that renders `AppSidebar` + `AppHeader` around a `SidebarProvider` (shadcn sidebar primitive).
- `client/src/pages/` — route-level pages, barrel-exported via [pages/index.ts](client/src/pages/index.ts).
- `client/src/components/common/` — shared chrome (sidebar, header, page header, content wrapper), barrel-exported via [index.ts](client/src/components/common/index.ts). Sidebar nav items in [AppSidebar.tsx](client/src/components/common/AppSidebar.tsx) currently point to routes (`/messages`, `/emails`, `/calendar`) that don't exist in `App.tsx` yet.
- `client/src/components/pages/<feature>/` — components scoped to one page/feature (e.g. `pages/dashboard/`, `pages/tasks/`), mirroring the page that uses them rather than a global feature-folder structure.
- `client/src/components/ui/` — shadcn/ui primitives (do not hand-edit these beyond what `shadcn add` generates; regenerate/re-add instead).
- Path alias `@/` maps to `client/src` (configured in both [vite.config.ts](client/vite.config.ts) and [components.json](client/components.json)).
- shadcn config: style `radix-nova`, base color `neutral`, icon library `lucide` — new components should follow these.
- Styling is Tailwind v4 (via `@tailwindcss/vite`, no separate tailwind.config needed) plus `tw-animate-css`; theming lives in [index.css](client/src/index.css) and [theme-provider.tsx](client/src/components/theme-provider.tsx).
- Heavier dashboard widgets (`EmailOpenRateChart`, `CompaniesSection`) are lazy-loaded with matching skeleton components in `skeletons/` for loading states — follow this pattern for new expensive components.
- Drag-and-drop on the Tasks kanban board ([Tasks.tsx](client/src/pages/Tasks.tsx), [Column.tsx](client/src/components/pages/tasks/Column.tsx)) is native HTML5 DnD, not `@dnd-kit` despite it being listed as a dependency in the spec.

### Server structure
Single-file Express app; there is no `src/` layout, no DB connection, and no routing modules yet. Any backend feature work currently means building this out from scratch — refer to [instructions.md](instructions.md) for the intended `server/src/{config,controllers,routes,middleware,models,services,jobs,emails,validators,lib}` structure and REST API design if asked to scaffold the backend, but confirm scope with the user first since it's a large amount of unbuilt surface area.

### Deployment
Both `client/` and `server/` have independent `vercel.json` files, implying separate Vercel deployments (client as a static SPA with catch-all rewrite to `index.html`; server as a Node serverless function via `@vercel/node`) rather than a single combined deployment.
