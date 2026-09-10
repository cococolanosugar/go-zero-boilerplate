## 1. Shared Utilities and Sensitive Data Masking

- [x] 1.1 Implement `maskPhone`, `maskEmail`, and `maskIdCard` in `packages/shared/src/utils/masking.ts`
- [x] 1.2 Implement `copyToClipboard`, `debounce`, `throttle`, and lift `exportCsv` into `packages/shared/src/utils/` and export in `packages/shared/src/index.ts`
- [x] 1.3 Add unit tests for masking and shared utilities in `apps/admin/tests/sharedUtils.test.ts` and verify with `pnpm test`

## 2. Inline HTML Shell Skeletons and Portal SEO

- [x] 2.1 Add inline CSS shell skeleton in `apps/admin/index.html` inside `<div id="root">`
- [x] 2.2 Add inline CSS shell skeleton in `apps/portal/index.html` inside `<div id="root">`
- [x] 2.3 Enrich `apps/portal/index.html` with description, keywords, OpenGraph `og:*` and Twitter card meta tags

## 3. ProTable Column State Persistence and Masked Renderers

- [x] 3.1 Configure `columnsState` persistence in `Users` and `Roles` pages with `persistenceType: 'localStorage'`
- [x] 3.2 Configure `columnsState` persistence in `Orders` page with `persistenceType: 'localStorage'`
- [x] 3.3 Configure `columnsState` persistence in `System/Logs`, `System/Apis`, and `System/Dicts` pages with `persistenceType: 'localStorage'`
- [x] 3.4 Integrate `maskPhone` and `maskEmail` into `Users` and `Orders` tables with copy action

## 4. Unsaved Form Navigation Guard

- [x] 4.1 Implement `useUnsavedWarning` hook in `apps/admin/src/hooks/useUnsavedWarning.ts`
- [x] 4.2 Integrate `useUnsavedWarning` into `StepForm` in `apps/admin/src/pages/Form/Step/index.tsx`
- [x] 4.3 Add unit tests for `useUnsavedWarning` in `apps/admin/tests/useUnsavedWarning.test.ts` and verify with `pnpm test`

## 5. Verification and Quality Gates

- [x] 5.1 Run `just test-frontend` and verify all unit tests pass with zero regressions
- [x] 5.2 Run `just lint-antd` and verify 0 Ant Design warnings or deprecations
- [x] 5.3 Run `just build-frontend` and verify clean production builds for both admin and portal
