## Context

The administrative console currently uses Ant Design ProLayout with compile-time routes in `frontend/apps/admin/src/config/routes.ts` as the single source of truth for navigation and rendering. Dynamic menu items and permission controls are driven by `sys_menu` records.

Prior iterations grouped all administrative pages under `/system`, and a recent intermediate step consolidated pages into a 3-pillar layout. Option A elevates organization management into its own first-class top-level domain (`/org`), establishing a 4-domain architecture (`/org`, `/permission`, `/system`, `/monitor`) that models the LinaPro benchmark.

## Goals / Non-Goals

**Goals:**
- Implement Option A by introducing `/org` as a dedicated top-level route group housing Department Management (`/org/dept`) and Post Management (`/org/post`).
- Refactor `/permission` to focus purely on IAM (Users, Roles, Menus) and `/system` to focus on platform settings (Config, Dicts, APIs, Notice).
- Maintain `/monitor` for operational visibility (Online users, Audit logs, OpenAPI).
- Provide zero-breakage backwards compatibility via client-side route redirects for historical paths.
- Keep database seeds (`init.sql`, `rbac.sql`), Atlas migration scripts, and frontend mock engines (`auth.mock.ts`) completely in sync.
- Preserve 100% test coverage across existing frontend test suites.

**Non-Goals:**
- Modifying backend Go gRPC or HTTP API logic (endpoints like `/api/v1/system/dept/*` and `/api/v1/system/post/*` remain strictly untouched).
- Modifying business tables other than `sys_menu` navigation entries.

## Decisions

### 1. Route Hierarchy and Path Namespaces
We adopt the LinaPro 4-domain taxonomy:
- `/org`: Organization Governance
  - `/org/dept`: Department Hierarchy (`System/Dept`)
  - `/org/post`: Post & Position Configuration (`SysPost`)
- `/permission`: IAM & Authorization
  - `/permission/users`: Employee User Accounts (`System/Users`)
  - `/permission/roles`: Role Permissions (`System/Roles`)
  - `/permission/menus`: Menu & Button Permissions (`System/Menus`)
- `/system`: Platform Configuration
  - `/system/config`: Parameter Settings (`SysConfig`)
  - `/system/dicts`: Data Dictionaries (`System/Dicts`)
  - `/system/apis`: API Resource Whitelist (`System/Apis`)
  - `/system/sys-notice`: System Notices & Announcements (`SysNotice`)
- `/monitor`: System Monitoring & Auditing
  - `/monitor/online`: Active Online User Sessions (`System/Online`)
  - `/monitor/logs`: Audit Operation & Login Logs (`System/Logs`)
  - `/monitor/openapi`: OpenAPI Interactive Specification (`System/OpenApi`)

*Alternative Considered*: Option B (3-pillar model merging Org into Permission). Rejected in favor of Option A per user directive to follow LinaPro's domain decoupling.

### 2. Backwards-Compatible Redirection Layer
All historic URLs (`/system/dept`, `/permission/dept`, `/system/sys-post`, `/permission/sys-post`) will be retained in `routes.ts` as explicit redirect targets pointing to `/org/dept` and `/org/post`.

*Rationale*: SPA client-side redirects execute instantaneously in React Router without triggering additional HTTP round-trips or breaking existing user bookmarks.

### 3. Database Seed & Migration Idempotency
A new Atlas migration script (`manifest/sql/migrations/20260913120000_split_org_permission_domain.sql`) will register `sys_menu` ID 7 (`组织管理`, path `/org`, icon `ApartmentOutlined`) and update `parent_id` and `sort` for department and post menus using idempotent `INSERT ... ON DUPLICATE KEY UPDATE` and `UPDATE` statements.

## Risks / Trade-offs

- **[Risk] Bookmarked URLs or direct links to older paths breaking**  
  → *Mitigation*: Register client-side redirect rules in `routes.ts` mapping `/system/dept`, `/permission/dept`, `/system/sys-post`, and `/permission/sys-post` to `/org/dept` and `/org/post`.
- **[Risk] Superadmin or existing roles losing menu access after parent_id changes**  
  → *Mitigation*: The `sys_menu` records for departments (37) and posts (38) retain their primary key IDs. Role-menu assignments in `sys_role_menu` bind to menu IDs, not paths or parent IDs, ensuring existing permissions remain intact.
- **[Risk] ProLayout menu key matching issues**  
  → *Mitigation*: Static route paths and `sys_menu` path attributes are aligned identically, ensuring breadcrumbs and active menu highlighting function seamlessly.

## Migration Plan

1. **Frontend Localization**: Add `menu.org`, `menu.org.dept`, and `menu.org.post` to `zh-CN.ts` and `en-US.ts`.
2. **Frontend Routing**: Configure `/org` route group in `routes.ts` and configure legacy redirects.
3. **Frontend Mock Engine**: Update `auth.mock.ts` with menu ID 7 and reparent department and post records.
4. **Database Seeds & Migration**: Update `init.sql`, `rbac.sql`, and generate a dedicated Atlas migration file.
5. **Verification**: Run frontend unit tests (`just test-frontend`) and verify navigation rendering.
