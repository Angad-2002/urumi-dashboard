# WordPress + WooCommerce Image

Docker image used by the [helm/store](../../helm/store/README.md) chart for WooCommerce stores. Expected image name: **`storeplatform/wordpress-woocommerce:latest`**.

## Prerequisites

- **Docker** (Desktop or Engine)
- **k3d** cluster named `store-platform` (for local import)

## Build and import (local k3d)

From repo root:

```bash
cd docker/wordpress-woocommerce
docker build -t storeplatform/wordpress-woocommerce:latest .
k3d image import storeplatform/wordpress-woocommerce:latest -c store-platform
```

Then run (or restart) the backend and create a WooCommerce store from the dashboard. The provisioned store will use this image.

One-liner from repo root:

```bash
cd docker/wordpress-woocommerce && docker build -t storeplatform/wordpress-woocommerce:latest . && k3d image import storeplatform/wordpress-woocommerce:latest -c store-platform
```

## Notes

- Use `-c store-platform` only if your k3d cluster is named `store-platform`.
- After import, the cluster uses the image from the local k3d image cache; no registry required for local.
- Re-run the import after any change to the Dockerfile or build context.

## Related

- [../../helm/store/README.md](../../helm/store/README.md) — Chart that uses this image
- [../README.md](../README.md) — All Docker images
