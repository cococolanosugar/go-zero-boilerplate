## 1. Public Branded Assets & Web Entry

- [x] 1.1 Create `frontend/apps/portal/public/favicon.svg` and `logo.svg` with purple theme branding (`#722ed1`) and `robots.txt`, and verify assets are readable
- [x] 1.2 Update `frontend/apps/portal/index.html` to link to `/favicon.svg` and update page title branding, and verify in HTML markup
- [x] 1.3 Update `frontend/apps/portal/src/config/defaultSettings.ts` to reference `/logo.svg`, and verify file updates

## 2. Global Styling & Scrollbars

- [x] 2.1 Create `frontend/apps/portal/src/global.css` with font-smoothing, text selection, and 6px theme-adaptive scrollbars, and verify CSS rules
- [x] 2.2 Import `global.css` into `frontend/apps/portal/src/main.tsx`, and verify file imports

## 3. Typings, Constants & Utilities

- [x] 3.1 Create `frontend/apps/portal/src/typings.d.ts` declaring Vite client types, static image imports, and environment variables, and verify file content
- [x] 3.2 Create `frontend/apps/portal/src/constants/index.ts` declaring `STORAGE_KEYS`, `PAGINATION`, and `REGEXP`, and verify constants export
- [x] 3.3 Create `frontend/apps/portal/src/utils/storage.ts` with `SafeStorage` scoped to `ZERO_PORTAL_`, `download.ts`, and `index.ts` barrel, and verify utility functions

## 4. Exception Pages & Routing Fallbacks

- [x] 4.1 Create `frontend/apps/portal/src/pages/Exception/404.tsx` with Ant Design Result component and navigation to `/home`, and verify component rendering
- [x] 4.2 Create `frontend/apps/portal/src/pages/Exception/500.tsx` with Ant Design Result component and refresh/return actions, and verify component rendering
- [x] 4.3 Update `frontend/apps/portal/src/config/routes.ts` to mount `/500` and route wildcard `*` to `Exception404`, and verify route definitions

## 5. Modular Footer & Components Barrel

- [x] 5.1 Extract modular `Footer` into `frontend/apps/portal/src/components/Footer/index.tsx`, and verify component structure
- [x] 5.2 Create `frontend/apps/portal/src/components/index.ts` to export `Footer`, and verify export barrel
- [x] 5.3 Refactor `frontend/apps/portal/src/app.tsx` to use the modular `Footer` component, and verify layout rendering

## 6. Verification & Linting

- [x] 6.1 Run TypeScript type checking (`pnpm --filter @zero/portal tsc --noEmit`) to verify zero type errors
- [x] 6.2 Run Ant Design static lint (`just lint-antd`) to verify zero deprecated props or warnings
- [x] 6.3 Run frontend build (`just build-frontend`) to verify clean production compilation of portal and admin