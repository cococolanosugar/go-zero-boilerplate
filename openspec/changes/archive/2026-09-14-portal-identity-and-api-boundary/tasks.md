## 1. Backend Gateway Contract & Stub Generation

- [x] 1.1 Add `UserProfileResp` DTO and `GET /api/v1/user/profile` route under `group: user` in `app/gateway/desc/user.api` and verify file formatting
- [x] 1.2 Run `just gen-gateway` to generate handler, types, and logic stubs, verifying clean generation without syntax errors

## 2. Backend Logic Implementation & Dual-Identity Aggregation

- [x] 2.1 Implement `GetUserProfileLogic` in `app/gateway/internal/logic/user/getuserprofilelogic.go` with dual-identity resolution (querying staff via `GetAdminProfile` first, falling back to customer via `GetUserInfo`), returning unified `UserProfileResp`
- [x] 2.2 Verify backend compilation with `go build ./app/gateway/...` and ensure error handling returns `xerr.RecordNotFound` when neither identity is found

## 3. Frontend Shared SDK Regeneration

- [x] 3.1 Run `just gen-ts` to regenerate `@zero/api` and verify that `getUserProfile` and `UserProfileResp` are exported from `frontend/packages/api`

## 4. Portal Initial State & Auth Decoupling

- [x] 4.1 Update `apps/portal/src/contexts/InitialStateContext.tsx` to type `currentUser?: UserProfileResp | null` and verify TypeScript compatibility
- [x] 4.2 Refactor `getInitialState()` in `apps/portal/src/app.tsx` to invoke `getUserProfile()` and eliminate fake dummy profile fallback objects
- [x] 4.3 Clean `apps/portal/src/contexts/AuthContext.tsx` by removing `portal_mobile_user` local storage writes and reads, calling `refreshInitialState()` on mobile login/logout

## 5. Portal Access Control & Service Layer Pruning

- [x] 5.1 Refactor `apps/portal/src/access.ts` to evaluate permissions purely from `currentUser?.roles` without evaluating hardcoded user IDs (`userId === 1`)
- [x] 5.2 Prune administrative management API client instances (`systemUsersApi`, `systemRolesApi`, `systemMenusApi`, `systemApisApi`, `systemLogsApi`) from `apps/portal/src/services/index.ts`
- [x] 5.3 Refactor `apps/portal/src/pages/Workbench/index.tsx` to consume portal-relevant endpoints (`getDashboardOverview`, `getUserProfile`, `getPortalNavList`) instead of administrative menu/API endpoints

## 6. Verification & Automated Testing

- [x] 6.1 Update and add unit tests in `apps/portal/tests/` to verify portal identity lifecycle, access control rules, and service export boundaries
- [x] 6.2 Run `just test-frontend` and `pnpm --filter @zero/portal build` to verify 100% test pass rate and clean build
