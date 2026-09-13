## 1. Backend Service Decoupling & Cleanup

- [x] 1.1 Terminate running `order.exe` background process and verify port 8081 is no longer listening via netstat or task manager
- [x] 1.2 Delete the `app/order/` directory from the repository and verify the directory is absent
- [x] 1.3 Remove `OrderRpc` configuration, client dependency, and order activities from `app/worker/`, update `worker.proto`, and verify `just gen-rpc worker` and Go build succeed
- [x] 1.4 Remove `desc/order.api` from `app/gateway/desc/`, add `desc/dashboard.api`, update `gateway.api`, and verify `just gen-gateway` generates gateway stubs without errors
- [x] 1.5 Update `app/gateway/internal/` (config, svc context, and `GetDashboardOverviewLogic` aggregating user profile and system task metrics via `mr.Finish`) and verify `go build ./app/gateway` succeeds

## 2. API SDK & Frontend Integration

- [x] 2.1 Regenerate frontend TypeScript SDK with `just gen-ts` and verify `@zero/api` compiles cleanly without order models
- [x] 2.2 Remove `orderService`, `/orders` route, and `pages/Orders/` from `frontend/apps/admin`, clean locales and imports, and verify `pnpm --filter admin build` succeeds
- [x] 2.3 Refactor `frontend/apps/admin/src/pages/Dashboard/index.tsx` to consume the new dashboard overview structure and verify TypeScript compilation
- [x] 2.4 Update `frontend/apps/portal/` to remove order service imports and update architecture overview cards to feature Worker RPC (:8082)
- [x] 2.5 Run full frontend automated tests with `pnpm test` and verify 100% test pass rate

## 3. Database, Tooling & Documentation Alignment

- [x] 3.1 Clean legacy order menu items and API permissions in `manifest/sql/` seed files
- [x] 3.2 Remove `run-order-rpc` and `gen-rpc order` commands from `justfile` and `Makefile`
- [x] 3.3 Update `AGENTS.md` and `README.md` to reflect the 3-service core architecture (Gateway, User, Worker)
- [x] 3.4 Execute full monorepo build with `pnpm -r build` and verify all packages build without warnings or errors
