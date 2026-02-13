# Medusa Next.js Storefront Image (Optional)

Docker image for the optional Next.js storefront used by the [helm/medusa-store](../../helm/medusa-store/README.md) chart. Expected image name: **`medusa-storefront:latest`**. Required only when `storefront.enabled: true` in the Medusa chart values; with `values-local.yaml`, the storefront is disabled by default.

## Build and import (local k3d)

From repo root:

```bash
cd docker/medusa-storefront
docker build -t medusa-storefront:latest .
k3d image import medusa-storefront:latest -c store-platform
```

Use `-c store-platform` only if your k3d cluster is named `store-platform`. Re-import after rebuilding the image.

## Related

- [../../helm/medusa-store/README.md](../../helm/medusa-store/README.md) — Chart and when storefront is used
- [../README.md](../README.md) — All Docker images
