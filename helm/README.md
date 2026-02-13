# Helm Charts — Per-Store Deployments

Helm charts used to deploy each store in its own Kubernetes namespace. The backend installs one of these charts per store (WooCommerce or Medusa) via `helm install` and removes them via `helm uninstall` on delete.

## Charts

| Chart | Description | Values |
|-------|-------------|--------|
| [store/](store/README.md) | **WooCommerce** — WordPress + MySQL, Ingress, optional ResourceQuota | `values.yaml`, `values-local.yaml`, `values-prod.yaml` |
| [medusa-store/](medusa-store/README.md) | **Medusa** — Medusa backend, optional Next.js storefront, PostgreSQL, Redis | `values.yaml`, `values-local.yaml`, `values-prod.yaml` |

## Usage (via backend)

The root **backend** installs a chart when you create a store from the dashboard:

- **WooCommerce:** Uses `HELM_CHART_PATH` (e.g. `../helm/store`). Values (storeId, DB password, WordPress admin password, ingress host) are set by the backend.
- **Medusa:** Uses `HELM_CHART_PATH_MEDUSA` (e.g. `../helm/medusa-store`). Values (storeName, storeId, Postgres password, JWT/cookie secrets, admin password, ingress host) are set by the backend.

Local vs production is selected by backend env **ENVIRONMENT**; the backend picks `values-local.yaml` or `values-prod.yaml` accordingly.

## Local vs production

- **Local (k3d/kind/minikube):** Use `values-local.yaml` — Traefik ingress, smaller PVCs, optional ResourceQuota off. Backend sets `LOCAL_INGRESS_SUFFIX` (e.g. `.localhost`).
- **Production (k3s on VPS):** Use `values-prod.yaml` — TLS hints if using cert-manager, larger PVCs, ResourceQuota on. Backend sets `PROD_INGRESS_SUFFIX` (e.g. `.yourdomain.com`). Point wildcard DNS to the VPS.

## Related

- [../README.md](../README.md) — Project setup and flow
- [../docs/SYSTEM_DESIGN.md](../docs/SYSTEM_DESIGN.md) — Architecture and production vs local
- [../backend/README.md](../backend/README.md) — How the backend uses these charts
- [../docker/README.md](../docker/README.md) — Images used by the charts
