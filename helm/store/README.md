# WooCommerce Store Helm Chart

Per-store Helm chart: WordPress + WooCommerce + MySQL in a single namespace, with Ingress and optional ResourceQuota. Used when creating a store with engine **WooCommerce** from the dashboard.

## Prerequisites

- **Image:** Build and load `storeplatform/wordpress-woocommerce:latest` (see [docker/wordpress-woocommerce/README.md](../../docker/wordpress-woocommerce/README.md)).
- **Cluster:** k3d/kind/minikube or k3s; Traefik (or compatible) Ingress controller for local.

## Values files

| File | Use case |
|------|----------|
| `values.yaml` | Defaults (base) |
| `values-local.yaml` | Local (k3d) — Traefik, 2Gi MySQL PVC, ResourceQuota off |
| `values-prod.yaml` | Production (k3s) — 10Gi MySQL PVC, ResourceQuota on |

The backend selects local vs prod based on `ENVIRONMENT` and passes required values via `--set`.

## Backend-supplied values

When the backend provisions a store, it sets:

- `storeId` — Unique store ID
- `wordpress.adminPassword` — WordPress admin password (generated)
- `mysql.auth.rootPassword`, `mysql.auth.password` — DB passwords (generated)
- `ingress.hosts[0].host` — Ingress host (e.g. `mystore.localhost` or `mystore.yourdomain.com`)

No secrets are stored in the repo; all are generated at provision time.

## Manual install (testing)

From repo root:

```bash
export NS="store-mystore"
export INGRESS_HOST="mystore.localhost"
export DB_PASS=$(openssl rand -base64 24)
export WP_ADMIN_PASS=$(openssl rand -base64 24)

helm install mystore ./helm/store \
  --namespace "$NS" --create-namespace \
  -f ./helm/store/values-local.yaml \
  --set storeId=mystore \
  --set mysql.auth.password="$DB_PASS" \
  --set mysql.auth.rootPassword="$DB_PASS" \
  --set wordpress.adminPassword="$WP_ADMIN_PASS" \
  --set "ingress.hosts[0].host=$INGRESS_HOST" \
  --wait --timeout 5m
```

## Components

| Component | Kind | Description |
|-----------|------|-------------|
| wordpress | Deployment | WordPress + WooCommerce; readiness/liveness on port 80 |
| mysql | StatefulSet | MySQL 8.0; PVC for data |
| wordpress-ingress | Ingress | Routes host to WordPress service |
| mysql-secret, wordpress-secret | Secret | DB and admin credentials |
| resourcequota | ResourceQuota | Optional; enabled in values-prod |

## Related

- [../README.md](../README.md) — Helm overview
- [../../docker/wordpress-woocommerce/README.md](../../docker/wordpress-woocommerce/README.md) — Image build
- [../../docs/SYSTEM_DESIGN.md](../../docs/SYSTEM_DESIGN.md) — Production vs local
