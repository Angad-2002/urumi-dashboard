# Frontend — Store Weaver Dashboard

React SPA (Store Weaver) for the Kubernetes store provisioning platform. Create, list, and delete stores; view status, URLs, and per-store K8s detail (resources, events, provisioning steps).

## Stack

- **Vite** — Build and dev server
- **React 18** — UI
- **TypeScript**
- **shadcn/ui** — Components
- **Tailwind CSS** — Styling
- **React Router** — Routing
- **Lucide** — Icons

## Features

- **Auth (demo):** Sign in / sign up by email (min 6 chars); stored in React state. Frontend sends `X-User-Id` to the API for per-user store list and store limit.
- **Store list:** Table with status, engine, URL, created time; search, filter (status, engine), sort, pagination.
- **Create store:** Dialog for name and engine (WooCommerce or Medusa).
- **Store detail:** Side panel with resources, events, provisioning steps, quotas (when backend is configured).
- **Delete:** Single or bulk delete with confirmation.
- **Retry:** Retry failed stores (single or bulk).
- **Mock mode:** If `VITE_API_URL` is unset, app uses mock data (no backend required).

## Prerequisites

- Node.js 20+
- Backend running (for real data) and `VITE_API_URL` set to backend base URL

## Setup

```bash
cd frontend
cp .env.example .env
```

Set in `.env`:

- **VITE_API_URL** — Backend base URL (e.g. `http://localhost:3000`). No trailing slash. Omit or leave empty to use mock data.

```bash
npm install
npm run dev
```

Dashboard: **http://localhost:5173** (or port shown by Vite). For production build: `npm run build`; serve the `dist/` output (e.g. via NGINX or static host).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Project layout

- **src/pages/** — Main dashboard (Index), routing
- **src/components/** — StoreRow, CreateStoreDialog, DeleteConfirmationModal, StoreSidePanel, StatsBar, SearchAndFilterBar, PaginationControls, BulkActionsToolbar, AuthDialog, ProfilePopover, UI (button, dialog, etc.)
- **src/lib/** — API client, types, mock data, auth context
- **src/hooks/** — e.g. useToast
- **public/** — Static assets

## Related

- [../README.md](../README.md) — Full project setup
- [../backend/README.md](../backend/README.md) — API and provisioning service
- [../docs/SYSTEM_DESIGN.md](../docs/SYSTEM_DESIGN.md) — Architecture
