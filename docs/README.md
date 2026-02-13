# Documentation

This folder contains design and architecture documentation for the Kubernetes Store Orchestration platform (Urumi Round 1).  
**Creator:** [@Angad-2002](https://github.com/Angad-2002)

## Contents

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | **Architecture diagrams** — High-level system, backend internals, provisioning and delete flows, per-store Kubernetes layout, data model, frontend–API usage, local vs prod |
| [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) | System design, architecture, idempotency/failure handling, production vs local, isolation, security, and horizontal scaling |

## Related

- Root [README.md](../README.md) — Quick start, local setup, and production deployment.
- [backend/README.md](../backend/README.md) — API and provisioning service.
- [frontend/README.md](../frontend/README.md) — Store Weaver dashboard.
- [helm/README.md](../helm/README.md) — Per-store Helm charts.
- [docker/README.md](../docker/README.md) — Store images (WooCommerce, Medusa).
