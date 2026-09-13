## Why

In `go-zero-boilerplate` and everyday enterprise development/operations, web entry points to internal platforms (Temporal Web UI, Nacos Console, Casdoor SSO, Swagger/OpenAPI docs, Jenkins, Prometheus, etc.) are scattered across different ports and URLs. Users and developers lack a centralized, unified navigation hub to discover, search, and jump to these tools.

Introducing a dedicated read-only Navigation page in Portal (`@zero/portal`) paired with a full-lifecycle datasource management route in Admin (`@zero/admin`) provides seamless technical discoverability without breaking the separation of concerns.

## What Changes

- **Portal Read-Only Navigation Page (`/navigation`)**:
  - Add an independent `/navigation` route under Portal top layout.
  - Present sites categorized into tabs/anchor groups (e.g. "Workflow & Tasks", "Service Governance", "DevOps & Monitoring", "Dev Tools").
  - Responsive card grid displaying site icon, title, description, tags, external link badge, and quick-copy URL button.
  - Client-side real-time filtering/search across site names, URLs, tags, and descriptions.
  - Dynamic `{HOST}` placeholder interpolation: automatically resolves `{HOST}:port` to the client's current browser hostname (`window.location.hostname`), avoiding broken localhost links when accessed from LAN or remote IPs.

- **Admin Datasource Management Route (`/system/navigation`)**:
  - Add an independent ProTable management page under Admin "System Management" group.
  - Full CRUD lifecycle management: create, edit, delete, and filter sites by category and status.
  - ModalForm fields: title, category, URL, icon (Antd icon name or image URL), description, tags, sort weight, open target (`_blank` / `_self`), and enabled/disabled switch.
  - RBAC protection with `system:navigation:list` permissions and automated audit logging via `sys_oper_log`.

- **Backend Microservice & Gateway Infrastructure**:
  - New MySQL table `sys_portal_nav` with Atlas migration and goctl Model (Cache-Aside Redis caching).
  - Proto definitions and RPC methods in `user` RPC (`GetPortalNavList`, `ListSysPortalNav`, `CreateSysPortalNav`, `UpdateSysPortalNav`, `DeleteSysPortalNav`).
  - Gateway BFF HTTP endpoints: public unauthenticated endpoint `GET /api/v1/portal/navigation/list` and authenticated admin CRUD endpoints under `POST/PUT/DELETE/GET /api/v1/system/navigation`.
  - Type-safe `@zero/api` SDK generated via `just gen-ts`.

## Capabilities

### New Capabilities
- `portal-navigation`: Enterprise technical site navigation directory in Portal and full-lifecycle datasource configuration in Admin.

### Modified Capabilities
<!-- None -->

## Impact

- **Database**: New migration creating `sys_portal_nav`.
- **Backend Services**: `app/user/rpc` (schema model, proto, rpc logic) and `app/gateway` (API specs, handlers, logic).
- **SDK**: `@zero/api` exports new portal navigation and admin navigation API functions.
- **Frontend Apps**:
  - `@zero/portal`: New route `/navigation`, Navigation page component, i18n locale keys in `zh-CN.ts`, `en-US.ts`, and `zh-TW.ts`.
  - `@zero/admin`: New route `/system/navigation`, Admin Navigation ProTable page, i18n locale keys.
- **Tests**: New unit tests in `apps/portal/tests/` and `apps/admin/tests/`.
