## 1. Database & Persistence Layer

- [x] 1.1 Create migration SQL file `manifest/sql/migrations/<timestamp>_create_sys_portal_nav.sql` and verify migration applies cleanly via `atlas migrate apply --env local`
- [x] 1.2 Generate Model code using `goctl model mysql ddl` and verify `app/user/model/sys_portal_nav_model*.go` compiles cleanly

## 2. Microservice & Gateway Contract

- [x] 2.1 Update `app/user/rpc/user.proto` with navigation messages and RPC methods, run `just gen-rpc user` and verify RPC client compiles
- [x] 2.2 Implement navigation logic in `app/user/rpc/internal/logic/user/` (list with Redis caching, create/update/delete with precision eviction) and verify RPC build
- [x] 2.3 Add API definitions `desc/portal_nav.api` and `desc/sys_nav.api`, include in `desc/gateway.api`, and run `just gen-gateway`
- [x] 2.4 Implement Gateway handlers and logic for both public portal navigation list and authenticated admin CRUD endpoints
- [x] 2.5 Run `just gen-ts` to regenerate `@zero/api` and verify export of navigation service methods

## 3. Admin Console Navigation Management (`@zero/admin`)

- [x] 3.1 Create Admin Navigation management page `apps/admin/src/pages/System/Navigation/index.tsx` with ProTable, ModalForm (URL validation, icon selector, tags, sort, status switch), and verify rendering
- [x] 3.2 Add route entry in `apps/admin/src/config/routes.ts` with permission `system:navigation:list` and verify route loads in browser
- [x] 3.3 Add i18n locale keys in `apps/admin/src/locales/` for navigation configuration and verify bilingual display

## 4. Portal Navigation Hub Page (`@zero/portal`)

- [x] 4.1 Create Portal Navigation page `apps/portal/src/pages/Navigation/index.tsx` with category tabs/anchors, search input, and responsive card grid
- [x] 4.2 Implement `{HOST}` dynamic placeholder interpolation and hybrid icon renderer (Antd icons + image URLs) with quick-copy URL feature
- [x] 4.3 Add route `/navigation` and top menu entry in `apps/portal/src/config/routes.ts` and verify navigation link in portal header
- [x] 4.4 Add i18n locale keys in `apps/portal/src/locales/` for navigation categories and UI copy

## 5. Testing & Verification

- [x] 5.1 Add unit tests in `apps/portal/tests/` for `{HOST}` interpolation and card filtering
- [x] 5.2 Add unit tests in `apps/admin/tests/` for navigation form validation
- [x] 5.3 Run `just lint-antd` to verify 0 Ant Design warnings across admin and portal
- [x] 5.4 Run `pnpm test` to verify all monorepo test suites pass cleanly
