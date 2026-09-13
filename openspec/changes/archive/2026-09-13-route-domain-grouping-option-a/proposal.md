## Why

The admin management console previously concentrated 12 disparate subpages under a single `/system` menu group, creating severe visual clutter, exceeding standard viewport heights, and conflating distinct domain responsibilities. Specifically, organizational structure (departments and posts) was mingled with identity and access control (IAM users, roles, menus), platform runtime configurations, and operational monitoring.

By adopting LinaPro's proven 4-domain architecture (`org`, `permission`, `system`, `monitor`), this change decouples organizational governance from access control. This delivers a clean cognitive hierarchy with 2-4 focused pages per group, adheres to enterprise-grade RBAC standards, and provides seamless backwards compatibility for all legacy URLs.

## What Changes

- **Add `/org` (组织管理) Top-Level Domain**: Establish a dedicated first-class route group containing Department Management (`/org/dept`) and Post Management (`/org/post`) with the `ApartmentOutlined` icon.
- **Pure IAM Domain `/permission` (权限管理)**: Restrict the permissions domain to identity access control and authorization: User Management (`/permission/users`), Role Management (`/permission/roles`), and Menu Permissions (`/permission/menus`).
- **Pure Platform Configuration `/system` (系统设置)**: Maintain platform parameters and metadata: Parameter Settings (`/system/config`), Data Dictionaries (`/system/dicts`), API Resource Dictionaries (`/system/apis`), and System Notices (`/system/sys-notice`).
- **Preserve `/monitor` (系统监控)**: Operational and auditing tools: Online Users (`/monitor/online`), Audit Logs (`/monitor/logs`), and OpenAPI Documentation (`/monitor/openapi`).
- **Backwards-Compatible URL Redirects**: Configure transparent client-side redirects for all legacy and transitional URL paths (`/system/dept` -> `/org/dept`, `/permission/dept` -> `/org/dept`, `/system/sys-post` -> `/org/post`, `/permission/sys-post` -> `/org/post`, `/system/users` -> `/permission/users`, etc.) ensuring existing bookmarks and direct links never 404.
- **Database & Mock Menu Seed Alignment**: Introduce top-level menu record `组织管理` (id: 7, path: `/org`, icon: `ApartmentOutlined`) in `sys_menu`, reparent department (37) and post (38) under menu 7, and register in migration scripts.
- **Internationalization (i18n)**: Register `menu.org`, `menu.org.dept`, and `menu.org.post` keys across `zh-CN.ts` and `en-US.ts` dictionaries.

## Capabilities

### New Capabilities
- `org-management`: Dedicated organization domain covering hierarchical department tree management and post/job position management under the `/org` namespace.

### Modified Capabilities
- `frontend-routing`: Update route hierarchy to support 4 decoupled system domains (`/org`, `/permission`, `/system`, `/monitor`), unified breadcrumb resolution, and comprehensive legacy route redirect mapping.

## Impact

- **Frontend Routing**: `frontend/apps/admin/src/config/routes.ts` updated with `/org` group and legacy redirect aliases.
- **Frontend Mock Engine**: `frontend/apps/admin/mock/auth.mock.ts` updated with menu tree parent-child links.
- **Frontend Localization**: `frontend/apps/admin/src/locales/zh-CN.ts` and `frontend/apps/admin/src/locales/en-US.ts`.
- **Database Seed & Migrations**: `manifest/sql/init.sql`, `manifest/sql/rbac.sql`, and a new migration script under `manifest/sql/migrations/`.
- **Frontend Workplace/Dashboard Quick Links**: Any internal references in `Workplace/index.tsx` pointing to dept or post paths.
