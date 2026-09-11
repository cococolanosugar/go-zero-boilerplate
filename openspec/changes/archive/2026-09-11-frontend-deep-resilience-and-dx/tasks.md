## 1. Request Timeout & 401 Redirect Preservation

- [x] 1.1 Implement timeout support with signal chaining in `packages/api/src/gocliRequest.ts` and verify unit test passes
- [x] 1.2 Update login page redirect in `apps/admin` and `apps/portal` to support `?from=...` query param and verify redirect behavior

## 2. Monorepo Shared Utilities & Hooks

- [x] 2.1 Implement `SafeStorage` in `packages/shared/src/utils/storage.ts` and export from `@zero/shared`
- [x] 2.2 Implement download utilities in `packages/shared/src/utils/download.ts` and export from `@zero/shared`
- [x] 2.3 Implement `useAbortController` in `packages/shared/src/hooks/useAbortController.ts` and export from `@zero/shared`
- [x] 2.4 Re-export storage, download, and abort controller in `apps/admin` and `apps/portal`, and verify unit tests pass

## 3. MultiTabs & CommandPalette DX

- [x] 3.1 Implement session persistence and "关闭右侧" in `apps/admin/src/components/MultiTabs/index.tsx` and verify tab closing logic
- [x] 3.2 Implement dynamic route discovery in `apps/admin/src/components/CommandPalette/index.tsx` and verify route search functionality

## 4. Offline Guard, Local Logo & Chart Dark Mode

- [x] 4.1 Implement offline status alert banner in `Root.tsx` for both `apps/admin` and `apps/portal` and verify event cleanup
- [x] 4.2 Replace external CDN logo with local `/favicon.svg` in `apps/admin` and `apps/portal` login components
- [x] 4.3 Implement dark mode theme adaptation for `@ant-design/charts` in `apps/portal/src/pages/Home/index.tsx`

## 5. Verification & Quality Gates

- [x] 5.1 Run full frontend test suite via `just test-frontend` and verify all tests pass
- [x] 5.2 Run Ant Design linter via `just lint-antd` and verify 0 errors and 0 warnings
- [x] 5.3 Run frontend build via `just build-frontend` and verify clean builds for all packages and apps
