## Why

The `order` service was originally introduced to demonstrate cross-microservice gRPC communication and `mr.Finish` concurrent data aggregation in the gateway. However, `order` is a mock e-commerce domain entity rather than a core platform governance capability, consuming an unnecessary port (8081), extra process memory, and maintenance overhead without providing real business value to the boilerplate. Removing it streamlines the repository into a clean, production-ready enterprise foundation centered strictly on Platform Identity/RBAC (`user`), Temporal Async Workflows (`worker`), and the unified BFF Gateway (`gateway`).

## What Changes

- **REMOVE `app/order` microservice**: Completely delete `app/order/` (including proto, model, and gRPC server), decommissioning port 8081.
- **DECOUPLE Gateway (`app/gateway`)**: Remove `desc/order.api` and `OrderRpc` client configuration. Refactor `GetDashboardOverview` to concurrently aggregate user profile data with system runtime/task statistics via `mr.Finish` instead of dummy order records.
- **DECOUPLE Worker (`app/worker`)**: Remove `OrderRpc` dependency from `worker.yaml`, config, and service context. Refactor or decouple workflow activities from external order RPCs.
- **CLEANUP Frontend (`frontend/apps/admin` & `portal`)**: Remove the `/orders` administrative route, order management page (`OrdersPage`), and order service exports from `@zero/api`. Update the Admin Dashboard to display system and task metric cards. Update architecture diagrams in Portal to showcase Worker RPC (:8082) instead of Order RPC.
- **CLEANUP Database & Scripts**: Remove pre-seeded order menu items and API permission records in database SQL manifests. Remove `run-order-rpc` and `gen-rpc order` commands from `justfile` and `Makefile`.

## Capabilities

### New Capabilities
- `clean-boilerplate-architecture`: Decommissions the mock order microservice, refactors dashboard aggregation to focus on platform and task metrics, and enforces a lean core service topology.

### Modified Capabilities
- `frontend-service-layer`: Removes the legacy order service namespace from domain-partitioned API exports and aligns frontend clients with clean platform services.

## Impact

- **Affected Code**: `app/order/` (removed), `app/gateway/` (desc, config, routes, dashboard logic), `app/worker/` (config, activities), `frontend/apps/admin/` (routes, pages, dashboard, locales), `frontend/apps/portal/` (home, services), `manifest/sql/`, `justfile`, `Makefile`, `AGENTS.md`.
- **Breaking Changes**: **BREAKING** - The gRPC service on port 8081 and HTTP endpoints under `/api/v1/order/*` are permanently removed. Downstream callers must use task and user APIs.
