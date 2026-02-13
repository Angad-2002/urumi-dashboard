# Docker — Store Images

Dockerfiles and build context for images used by the Helm charts. Build these images and (for local k3d) import them into the cluster; the charts reference them by name.

## Images

| Folder | Image | Used by | Required for |
|--------|-------|---------|----------------|
| [wordpress-woocommerce/](wordpress-woocommerce/README.md) | `storeplatform/wordpress-woocommerce:latest` | [helm/store](../helm/store/README.md) | WooCommerce stores |
| [medusa-backend/](medusa-backend/README.md) | `medusa-backend:latest` | [helm/medusa-store](../helm/medusa-store/README.md) | Medusa stores |
| [medusa-storefront/](medusa-storefront/README.md) | `medusa-storefront:latest` | helm/medusa-store (optional) | Medusa Next.js storefront when `storefront.enabled: true` |

## Local (k3d)

From repo root, build and import so the cluster can pull the image without a registry:

```bash
# WooCommerce
cd docker/wordpress-woocommerce
docker build -t storeplatform/wordpress-woocommerce:latest .
k3d image import storeplatform/wordpress-woocommerce:latest -c store-platform

# Medusa backend (required for Medusa stores)
cd docker/medusa-backend
docker build -t medusa-backend:latest .
k3d image import medusa-backend:latest -c store-platform

# Medusa storefront (optional; only if enabling storefront in medusa-store values)
cd docker/medusa-storefront
docker build -t medusa-storefront:latest .
k3d image import medusa-storefront:latest -c store-platform
```

Use `-c store-platform` only if your k3d cluster is named `store-platform`. Re-import after rebuilding an image.

## Production (k3s / VPS)

Build images and push to a registry your cluster can pull from (e.g. Docker Hub, ECR, GCR). Update the Helm chart values or backend so the chart uses the correct image (repository/tag). No `k3d image import` on the VPS.

## Related

- [../README.md](../README.md) — Full setup
- [../helm/README.md](../helm/README.md) — Charts that use these images
