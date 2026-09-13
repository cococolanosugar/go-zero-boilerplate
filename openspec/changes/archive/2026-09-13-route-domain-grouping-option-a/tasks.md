## 1. Localization & Route Definitions

- [x] 1.1 Add i18n localization keys (`menu.org`, `menu.org.dept`, `menu.org.post`) to `frontend/apps/admin/src/locales/zh-CN.ts` and `frontend/apps/admin/src/locales/en-US.ts`, and verify with TypeScript compilation.
- [x] 1.2 Add top-level `/org` route group (`/org/dept` and `/org/post`) with `ApartmentOutlined` icon in `frontend/apps/admin/src/config/routes.ts`, and refine `/permission` to strictly contain Users, Roles, and Menus.
- [x] 1.3 Configure transparent client-side redirect rules in `routes.ts` for legacy routes (`/system/dept` -> `/org/dept`, `/permission/dept` -> `/org/dept`, `/system/sys-post` -> `/org/post`, `/permission/sys-post` -> `/org/post`) and verify direct URL accesses redirect cleanly.
- [x] 1.4 Check and update quick navigation links or references in `frontend/apps/admin/src/pages/Workplace/index.tsx` to point to `/org/dept` and `/org/post`.
- [x] 1.5 Move Employee Management (`/permission/users` -> `/org/users`) to complete the "人·岗·部" entity domain under `/org`, and add backwards-compatible redirects for `/permission/users` and `/system/users`.
- [x] 1.6 Separate Notice/Announcement into an independent top-level route `/notice` (`menu.notice`, `BellOutlined`), add `NOTICE_VIEW` permissions, and provide backwards-compatible redirects for `/system/sys-notice` and `/sys-notice`.

## 2. Mock Engine & Database Seeds

- [x] 2.1 Update `frontend/apps/admin/mock/auth.mock.ts` to include top-level menu record 7 (`组织管理`, path `/org`, icon `ApartmentOutlined`, sort 3) and reparent department (37) and post (38) to parent_id 7.
- [x] 2.2 Update database seed files `manifest/sql/init.sql` and `manifest/sql/rbac.sql` to register menu ID 7 and reflect the 4-domain organization and permission hierarchy.
- [x] 2.3 Create an idempotent Atlas database migration script `manifest/sql/migrations/20260913120000_split_org_permission_domain.sql` that updates `sys_menu` safely for existing database deployments.
- [x] 2.4 Create Atlas migration `manifest/sql/migrations/20260913130000_move_user_to_org_domain.sql` reparenting employee management (ID 31) under 组织管理 (ID 7) with sort 1, and run `just migrate-up`.
- [x] 2.5 Create Atlas migration `manifest/sql/migrations/20260913140000_separate_sys_notice_top_level.sql` promoting notice (ID 39) to top level (sort 5) and rebalancing subsequent group sorts, and run `just migrate-up`.

## 3. Verification & Quality Assurance

- [x] 3.1 Run frontend automated tests with `pnpm --filter admin test` to verify zero regression across routing and access control test suites.
- [x] 3.2 Verify the live admin application in the browser to confirm that `/org`, `/permission`, `/system`, and `/monitor` render as 4 separate balanced menu groups, and that legacy URL redirects function without page reload.
- [x] 3.3 Verify live browser rendering of `/org/users`, sidebar hierarchy under 组织管理, and transparent redirection from legacy `/permission/users` and `/system/users`.
- [x] 3.4 Verify live browser rendering of `/notice` as an independent top-level item with `BellOutlined` icon, clean 3-item submenus under 系统配置, and seamless redirects from `/system/sys-notice`.
