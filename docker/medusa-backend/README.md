# Medusa Backend Image

Docker image for the Medusa API + Admin used by the [helm/medusa-store](../../helm/medusa-store/README.md) chart. Expected image name: **`medusa-backend:latest`**. There is no official published image; you must build this before creating Medusa stores.

## Prerequisites

- **Docker** (Desktop or Engine)
- **k3d** cluster named `store-platform` (for local import)

## Build and import (local k3d)

From repo root:

```bash
cd docker/medusa-backend
docker build -t medusa-backend:latest .
k3d image import medusa-backend:latest -c store-platform
```

Then start the backend and create a store with engine **Medusa** from the dashboard. The provisioned store will use this image.

One-liner from repo root:

```bash
cd docker/medusa-backend && docker build -t medusa-backend:latest . && k3d image import medusa-backend:latest -c store-platform
```

## Notes

- Use `-c store-platform` only if your k3d cluster is named `store-platform`.
- After import, the cluster uses the image locally; no registry required for local.
- Re-run the import after any change to the Dockerfile.

## Related

- [../../helm/medusa-store/README.md](../../helm/medusa-store/README.md) — Chart that uses this image
- [../README.md](../README.md) — All Docker images
