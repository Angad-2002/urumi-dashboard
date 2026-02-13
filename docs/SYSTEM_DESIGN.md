# System Design & Tradeoffs (Urumi Round 1)

## Architecture

- **Dashboard (Store Weaver):** React SPA. Signs in with email (in-memory); sends `X-User-Id` to API for per-user store list and limit. Polls store list every 5s when any store is provisioning or deleting.
- **Backend:** Express API. Creates store record in PostgreSQL, then provisions asynchronously via Helm (namespace-per-store). Uses Kubernetes client to monitor readiness and to serve store detail (resources, events).
- **Helm:** One chart per store; values differ via `values-local.yaml` / `values-prod.yaml`. Same chart runs locally (k3d) and on VPS (k3s).

## Idempotency / failure handling / cleanup

- **Create:** Store record is created with status `Provisioning`; Helm install runs in background. On failure, backend runs cleanup (helm uninstall, namespace delete) and sets status `Failed` with `error_message`. No duplicate stores for the same namespace (slug from name; collision adds short suffix).
- **Retry:** Only for `Failed` stores; status set to `Provisioning` and provisioning is re-run (same flow as create). No new DB row.
- **Delete:** Status set to `Deleting`; then helm uninstall, namespace delete, DB delete. If Helm release is missing, namespace and DB are still cleaned up. Errors during delete set status to `Failed` and are rethrown to client.

## Production vs local (Helm values)

- **Local:** `values-local.yaml` — ingress class (e.g. traefik), smaller PVC if needed, optional ResourceQuota off. Backend: `LOCAL_INGRESS_SUFFIX=.localhost` (or `.127.0.0.1.nip.io`).
- **Production:** `values-prod.yaml` — TLS (if cert-manager), `PROD_INGRESS_SUFFIX=.yourdomain.com`, DNS wildcard to VPS. Backend: `ENVIRONMENT=production`, `DATABASE_URL`, `KUBECONFIG` for the cluster.
- **Secrets:** DB and WordPress admin passwords generated in backend, passed to Helm via `--set`; no secrets in repo.
- **Upgrade/rollback:** Helm upgrade/rollback as usual; store record in DB is unchanged unless you add a version field later.

## Isolation and guardrails

- One namespace per store; all store resources (Deployment, StatefulSet, Services, PVC, Ingress, Secrets) live in that namespace.
- Per-user store limit via `MAX_STORES_PER_USER` and optional `X-User-Id`.
- Global cap: `MAX_STORES`, `MAX_CONCURRENT_PROVISIONS` to avoid thundering herd.
- Optional: ResourceQuota per namespace (chart supports it; can enable in values).

## Security

- No hardcoded secrets; passwords and DB credentials generated at provision time.
- Backend uses in-cluster KubeConfig or `KUBECONFIG`; for production, RBAC (e.g. `kubernetes/rbac.yaml`) and least-privilege ServiceAccount are recommended.
- CORS allows configured origins (dashboard URL).

## Horizontal scaling

- Backend is stateless; multiple replicas can share the same DB. Concurrency is guarded by `MAX_CONCURRENT_PROVISIONS` (in-memory per process; for multi-replica, use a distributed lock or queue if needed).
- Dashboard is static; scale via ingress/replicas.
- Per-store workloads (WordPress/MySQL) scale within the chart (replicas, resources) as needed.
