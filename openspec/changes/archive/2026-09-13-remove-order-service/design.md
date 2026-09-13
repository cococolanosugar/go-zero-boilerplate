## Context

The `go-zero-boilerplate` monorepo currently contains three backend services (`gateway`, `user`, `worker`) plus the legacy `order` service. `order` was originally designed as an e-commerce mock service to illustrate cross-service RPC and `mr.Finish` concurrency. Now that a production-grade async task management and Temporal orchestration system is implemented in `worker`, the `order` service is redundant. Decommissioning it reduces system complexity, releases port 8081, and eliminates dummy domain code from the core boilerplate.

See `proposal.md` for motivation and background.

## Goals / Non-Goals

**Goals:**
- Completely remove `app/order/` from the repository and decommission gRPC port 8081.
- Decouple `app/gateway` from `OrderRpc` and `order.api`.
- Retain and elevate the `mr.Finish` concurrency pattern by moving the Dashboard Overview endpoint to `desc/dashboard.api` (under `/api/v1/dashboard/overview`) to concurrently aggregate authenticated user profile data with system runtime and task metrics.
- Decouple `app/worker` from `OrderRpc`, purging order-specific activities and proto methods (`StartOrderSaga`, `PayOrderWorkflow`) while preserving generic Temporal primitives (`GetWorkflowDetail`, `SignalWorkflow`) and `AsyncTask` capabilities.
- Purge legacy `/orders` route, UI page (`OrdersPage`), and order API services from frontend apps (`apps/admin`, `apps/portal`, `@zero/api`).
- Clean up database seed manifests (`sys_menu`, `sys_api`) and project build scripts (`justfile`, `Makefile`, `AGENTS.md`).
- Ensure all automated tests (`Vitest` frontend, Go compilation, `pnpm -r build`) pass 100%.

**Non-Goals:**
- Introducing a replacement domain e-commerce service.
- Modifying user authentication, RBAC, Casdoor SSO, or department/org business logic.

## Decisions

### Decision 1: Relocate and Refactor Dashboard Overview
- **Choice**: Create `app/gateway/desc/dashboard.api` with route `GET /api/v1/dashboard/overview`, replacing `order.api`.
- **Logic**: In `GetDashboardOverviewLogic`, use `mr.Finish` to execute two concurrent tasks:
  1. `UserRpc.GetUserInfo(l.ctx, ...)`
  2. Aggregation of system runtime stats and task execution metrics (e.g. task counts from `WorkerRpc` or local system stats).
- **Rationale**: Preserves the educational and architectural demonstration of go-zero's `mr.Finish` concurrent fan-out, while making the data directly applicable to an administrative dashboard.
- **Alternatives Considered**: Dropping `GetDashboardOverview` entirely. Rejected because the Admin Dashboard UI heavily relies on an overview endpoint to display system health and user welcome data.

### Decision 2: Decouple Temporal Worker from Order Domain
- **Choice**: Clean `worker.proto` of `StartOrderSaga` and `PayOrderWorkflow`, delete `order_activities.go`, and retain general-purpose workflow handlers and `AsyncTask` schedule management.
- **Rationale**: The Temporal worker becomes a clean, domain-agnostic task engine ready for any enterprise workflow (e.g. batch exports, data cleanup, notifications).
- **Alternatives Considered**: Keeping mock order activities inside worker with internal memory mocks. Rejected as it preserves confusing dead code.

### Decision 3: Remove Order Administrative UI & Menu
- **Choice**: Delete `frontend/apps/admin/src/pages/Orders/`, remove route `/orders` from `routes.ts`, remove `ShoppingCartOutlined` and `/orders` translation keys, and delete order records from `sys_menu` / `sys_api`.
- **Rationale**: Leaves the admin sidebar with crisp, purposeful categories: `仪表盘 (Dashboard)`, `任务管理 (Tasks)`, and `系统管理 (System)`.
- **Alternatives Considered**: Keeping an empty or mocked orders page. Rejected because dead UI undermines boilerplate quality.

## Risks / Trade-offs

- **[Risk] Broken Frontend API SDK References** → **Mitigation**: Run `just gen-gateway` followed by `just gen-ts` to regenerate `@zero/api`. Remove `orderService` exports and fix any lingering imports across `admin` and `portal`.
- **[Risk] Route 404 or Tab Desync in Admin Multi-Tabs** → **Mitigation**: Remove `/orders` from `multiTabs.test.ts` and ensure default tab fallback remains `/dashboard`.
- **[Risk] Process Port Conflicts During Cleanup** → **Mitigation**: Terminate background `order.exe` process (PID listening on 8081) and verify gateway and worker start cleanly without searching for 8081.

## Migration Plan

1. **Stop Services**: Terminate running `order.exe` process.
2. **Backend Gateway & Worker**:
   - Update `app/gateway/desc/` (add `dashboard.api`, remove `order.api`, update `gateway.api`).
   - Run `just gen-gateway`.
   - Update `app/gateway/internal/` (config, svc, dashboard logic).
   - Update `app/worker/rpc/worker.proto`, remove `order.Order` from worker config and svc, run `just gen-rpc worker`.
3. **Delete Order Service**: Delete `app/order/`.
4. **Regenerate SDK**: Run `just gen-ts`.
5. **Frontend Cleanup**:
   - Update `packages/api/src/services/` (remove `order.ts`).
   - Update `apps/admin/` (delete `pages/Orders`, update `Dashboard`, routes, services, locales).
   - Update `apps/portal/` (clean services and mock architecture cards).
6. **SQL & Build Scripts**: Clean `manifest/sql/`, `justfile`, `Makefile`, and `AGENTS.md`.
7. **Verification**: Run `pnpm test`, `just build-frontend`, and Go build check across all modules.
