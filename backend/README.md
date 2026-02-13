# Backend — Store Weaver API & Provisioning

Node.js API that serves the Store Weaver dashboard and provisions WooCommerce/Medusa stores on Kubernetes via Helm. Single service: REST API + async provisioning + K8s monitoring.

## Responsibilities

- **Store CRUD:** Create, list, get, delete stores (PostgreSQL).
- **Provisioning:** On create, install Helm chart in a dedicated namespace (WooCommerce or Medusa), wait for readiness, then set store URL and status.
- **Monitoring:** Expose store detail (K8s resources, events, provisioning steps) for the dashboard.
- **Retry:** Re-run provisioning for failed stores.
- **Quotas:** Enforce `MAX_STORES`, `MAX_STORES_PER_USER`, `MAX_CONCURRENT_PROVISIONS` (env-configurable).

## Stack

- **Express** — REST API
- **Knex + PostgreSQL** — Store metadata and migrations
- **@kubernetes/client-node** — Namespace, deployments, StatefulSets, Ingress, events
- **Helm (CLI)** — `helm install` / `helm uninstall` for per-store charts
- **TypeScript**

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Docker)
- `kubectl` and **Helm 3** on `PATH`
- Kubernetes cluster (e.g. k3d) for provisioning; optional for API-only (list/create will fail without cluster)

## Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

- **DATABASE_URL** — PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/storeweaver`)
- **KUBECONFIG** — Path to kubeconfig (or leave empty for in-cluster)
- **HELM_CHART_PATH** — Path to WooCommerce chart (e.g. `../helm/store` or absolute)
- **HELM_CHART_PATH_MEDUSA** — Path to Medusa chart (e.g. `../helm/medusa-store`)
- **LOCAL_INGRESS_SUFFIX** — Local host suffix (e.g. `.localhost` or `.127.0.0.1.nip.io`)
- **ENVIRONMENT** — `local` or `production` (for prod: **PROD_INGRESS_SUFFIX**, **DATABASE_URL**)
- **CORS_ORIGIN** — Allowed origins for dashboard (e.g. `http://localhost:5173,http://localhost:8080`)
- **MAX_STORES**, **MAX_STORES_PER_USER**, **MAX_CONCURRENT_PROVISIONS** — Quotas (optional)

```bash
npm install
npm run migrate
npm run dev
```

API base: **http://localhost:3000** (or `PORT` from `.env`).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stores` | List stores (optional `X-User-Id` to filter) |
| POST | `/api/stores` | Create store; body: `{ "name": "My Store", "engine": "woocommerce" \| "medusa" }`; optional `X-User-Id` |
| GET | `/api/stores/:id` | Get store |
| GET | `/api/stores/:id/status` | Status, url, error_message |
| GET | `/api/stores/:id/detail` | K8s resources, events, provisioning steps, quotas |
| POST | `/api/stores/:id/retry` | Retry failed store |
| DELETE | `/api/stores/:id` | Delete store (Helm uninstall, namespace delete, DB remove) |

## Project layout

- **src/index.ts** — Express app, CORS, routes, error handler
- **src/routes/** — Route definitions
- **src/controllers/** — Request handlers
- **src/services/** — store.service, helm.service, kubernetes.service, monitor.service
- **src/repositories/** — Store DB access
- **src/models/** — Store type
- **src/middleware/** — Error handler, request logger
- **src/utils/** — crypto (slug, password), logger, exec (helm CLI)
- **migrations/** — Knex migrations

## Related

- [../README.md](../README.md) — Full project setup
- [../docs/SYSTEM_DESIGN.md](../docs/SYSTEM_DESIGN.md) — Architecture and tradeoffs
- [../helm/README.md](../helm/README.md) — Per-store Helm charts
