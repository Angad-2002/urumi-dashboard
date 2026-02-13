# Medusa Store Helm Chart

Per-store Helm chart for **Medusa** stores: Medusa backend (API + Admin), optional Next.js storefront, PostgreSQL, and Redis in a single namespace. Used when creating a store with engine **Medusa** from the dashboard.

## Prerequisites

- **Medusa backend image:** Build and load `medusa-backend:latest` (see [docker/medusa-backend/README.md](../../docker/medusa-backend/README.md)). No official image; required for Medusa stores.
- **Storefront (optional):** If `storefront.enabled: true`, build and load `medusa-storefront:latest` (see [docker/medusa-storefront/README.md](../../docker/medusa-storefront/README.md)). With `values-local.yaml`, storefront is disabled by default.
- **PostgreSQL & Redis:** Deployed by the chart from official images.

## Values files

| File | Use case |
|------|----------|
| `values.yaml` | Defaults (base) |
| `values-local.yaml` | Local — Traefik, storefront disabled, 2Gi Postgres PVC |
| `values-prod.yaml` | Production — larger PVC, TLS hints |

The backend selects local vs prod and passes required values via `--set`.

## Backend-supplied values

When the backend provisions a Medusa store, it sets:

- `storeName`, `storeId`
- `ingress.host` — Ingress host (e.g. `mystore.localhost`)
- `postgres.password` — PostgreSQL password (generated)
- `medusa.adminEmail`, `medusa.adminPassword` — Admin user (generated)
- `medusa.jwtSecret`, `medusa.cookieSecret` — Secrets (generated)
- `medusa.seedDemoData` — e.g. `true` for demo

## Manual install (testing)

From repo root:

```bash
export STORE_NAME="my-medusa-store"
export NS="store-my-medusa-store"
export POSTGRES_PASSWORD=$(openssl rand -base64 16 | tr -d /=+)
export JWT_SECRET=$(openssl rand -base64 32)
export COOKIE_SECRET=$(openssl rand -base64 32)
export ADMIN_PASSWORD="Admin123!"

helm install my-medusa ./helm/medusa-store \
  --namespace "$NS" --create-namespace \
  -f ./helm/medusa-store/values-local.yaml \
  --set storeName="$STORE_NAME" \
  --set storeId="manual-1" \
  --set ingress.host="my-medusa-store.localhost" \
  --set postgres.password="$POSTGRES_PASSWORD" \
  --set medusa.jwtSecret="$JWT_SECRET" \
  --set medusa.cookieSecret="$COOKIE_SECRET" \
  --set medusa.adminPassword="$ADMIN_PASSWORD" \
  --set medusa.seedDemoData=true
```

## Components

| Component | Kind | Port | Description |
|-----------|------|------|-------------|
| {storeId}-medusa | Deployment | 9000 | Medusa API + Admin UI |
| {storeId}-storefront | Deployment | 8000 | Next.js storefront (optional) |
| {storeId}-postgres | StatefulSet | 5432 | PostgreSQL |
| {storeId}-redis | Deployment | 6379 | Redis |
| Ingress | Ingress | — | Routes host to Medusa (and storefront if enabled) |

## URLs

- **Medusa API / Admin:** Ingress host (e.g. `http://mystore.localhost`) and path `/app` for admin.
- **Storefront:** Same host when storefront is enabled (path or port depends on Ingress config).

## Related

- [../README.md](../README.md) — Helm overview
- [../../docker/medusa-backend/README.md](../../docker/medusa-backend/README.md) — Medusa image
- [../../docker/medusa-storefront/README.md](../../docker/medusa-storefront/README.md) — Storefront image (optional)
- [../../docs/SYSTEM_DESIGN.md](../../docs/SYSTEM_DESIGN.md) — Architecture
