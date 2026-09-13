## Context

The system operates as a fullstack monorepo:
- Backend: go-zero HTTP Gateway (`app/gateway`) acting as the unified BFF, communicating with downstream gRPC services (`app/user/rpc`, `app/worker/rpc`).
- Frontend: pnpm workspace with `@zero/admin` (internal management), `@zero/portal` (developer/consumer portal), and shared `@zero/api` client SDK.
- Data Storage: Two distinct user tables exist in MySQL:
  - `sys_user`: Internal company staff, linked to departments (`sys_dept`) and RBAC roles (`sys_role`).
  - `user`: External consumer users (registered via mobile SMS / phone number).

Currently, `apps/portal` was coupled to `getAdminProfile` (`GET /api/v1/system/user/profile`), which only queries `sys_user`. External customers logging into the portal via mobile SMS received 404 errors, prompting the portal frontend to fabricate an artificial `{ id: 0, roles: ["ROLE_USER"] }` in `localStorage` under `portal_mobile_user`. Additionally, the portal service layer leaked administrative API instances (`systemUsersApi`, `systemRolesApi`, etc.), and the portal Workbench demo page called admin menu and API dictionary endpoints.

See `proposal.md` for background and problem motivation.

## Goals / Non-Goals

**Goals:**
- Provide a clean, domain-driven `GET /api/v1/user/profile` endpoint in `app/gateway/desc/user.api`.
- In `GetUserProfileLogic`, resolve dual-table identity server-side based on caller JWT claims:
  - Check `UserRpc.GetAdminProfile(userId)`. If present, return `userType = "employee"` with staff department and roles.
  - If absent/error, query `UserRpc.GetUserInfo(userId)` from `user` table. If present, return `userType = "customer"`, masked mobile, default role `ROLE_USER`, and `deptName = "业务客户"`.
  - If neither exists, return `xerr.RecordNotFound`.
- Regenerate `@zero/api` TypeScript client with `getUserProfile` and `UserProfileResp`.
- Refactor `apps/portal` to consume `getUserProfile()` strictly from server responses, eliminating `portal_mobile_user` local dummy object fabrication entirely.
- Prune back-office management API exports from `apps/portal/src/services/index.ts`.
- Refactor `apps/portal/src/pages/Workbench/index.tsx` to showcase portal-domain APIs (`getDashboardOverview`, `getUserProfile`, `getPortalNavList`).
- Align portal `access.ts` to inspect roles without hardcoded user ID checks (`profile?.id === 1`).
- Ensure all frontend unit tests pass.

**Non-Goals:**
- Merging the underlying `sys_user` and `user` tables in MySQL (they serve separate domains with different lifecycle, audit, and credential requirements).
- Changing the administrative app (`apps/admin`) profile flow (admin continues to use `getAdminProfile` with full RBAC menu tree resolution).
- Creating a fragmented `portal.api` specification (portal endpoints should belong to their respective domain APIs, e.g., `user.api`, `dashboard.api`, `portal_navigation.api`).

## Decisions

### Decision 1: Domain-First Profile Placement in `user.api`
- **Choice**: Add `UserProfileResp` and `GET /api/v1/user/profile` directly to `app/gateway/desc/user.api` under `group: user`.
- **Rationale**: User identity aggregation is a core capability of the User Domain, not exclusive to the portal app. Future consumer-facing clients (e.g. mobile H5, mini-programs, CLI tools) can reuse this exact contract.
- **Alternatives Considered**: Creating `desc/portal.api`. Rejected to avoid BFF API fragmentation and duplicate profile logic across different clients.

### Decision 2: Server-Authoritative Dual-Identity Aggregator in Gateway Logic
- **Choice**: The gateway `GetUserProfileLogic` queries `UserRpc.GetAdminProfile(userId)` first; if not found, it queries `UserRpc.GetUserInfo(userId)`:
  ```mermaid
  sequenceDiagram
      autonumber
      actor Client as Portal Client
      participant GW as Gateway (GetUserProfileLogic)
      participant RPC as User gRPC Microservice
      participant DB as Database (sys_user / user)

      Client->>GW: GET /api/v1/user/profile (Bearer JWT)
      GW->>GW: Extract userId from JWT Claims
      GW->>RPC: GetAdminProfile(userId)
      alt Staff found in sys_user
          RPC-->>GW: AdminProfileResp (dept, roles, email)
          GW-->>Client: UserProfileResp (userType="employee", deptName, roles)
      else Not found in sys_user
          GW->>RPC: GetUserInfo(userId)
          alt Customer found in user table
              RPC-->>GW: UserInfoResp (mobile, nickname, avatar)
              GW-->>Client: UserProfileResp (userType="customer", roles=["ROLE_USER"], deptName="业务客户")
          else Neither found
              GW-->>Client: HTTP 404 (xerr.RecordNotFound)
          end
      end
  ```
- **Rationale**: Employees may log into the portal to review API documentation or technical navigation, while customers log into the portal to access services. This server-side resolution gives employees their rich profile and customers their customer profile seamlessly, without breaking existing tokens.
- **Alternatives Considered**: Adding a `user_type` claim to JWT tokens during login. Rejected because existing tokens in the wild would fail to resolve until re-login, whereas server-side query fallback is 100% backward-compatible.

### Decision 3: Zero Local Identity Fabrication in Portal
- **Choice**: Completely remove the `portal_mobile_user` dummy cache in `AuthContext.tsx` and `app.tsx`.
- **Rationale**: Client-side identity fabrication masks API failures, creates desynchronization bugs, and introduces security ambiguities. The portal initial state must reflect actual server responses.
- **Alternatives Considered**: Retaining local storage caching as an offline fallback. Rejected because authenticated portal features require network connectivity and valid tokens anyway.

### Decision 4: Strict Service Layer Export Pruning
- **Choice**: In `apps/portal/src/services/index.ts`, remove exports for `systemUsersApi`, `systemRolesApi`, `systemMenusApi`, `systemApisApi`, and `systemLogsApi`.
- **Rationale**: Prevents accidental import of admin-only management services in portal code, reduces bundle footprint, and clearly defines the portal capability boundary.

## Risks / Trade-offs

- **[Risk]** Extra RPC call on customer profile queries (first tries `GetAdminProfile`, then `GetUserInfo`).
  - **Mitigation**: `GetAdminProfile` utilizes Redis caching (`CachedConn`) via `sys_user` ID lookup, resulting in sub-millisecond query time. Profile fetch only occurs once during application initialization (`getInitialState`).
- **[Risk]** Breaking portal pages that might inadvertently call pruned admin APIs.
  - **Mitigation**: Codebase audit confirmed that only `Workbench/index.tsx` was calling `getSysMenuTree` and `listSysApis` for demonstration purposes. These calls will be replaced with real portal domain endpoints (`getDashboardOverview`, `getUserProfile`, `getPortalNavList`).
- **[Risk]** Portal unit tests breaking due to type signature changes (`AdminProfileResp` -> `UserProfileResp`).
  - **Mitigation**: Update test mocks in `apps/portal/tests/` to reflect `UserProfileResp`.

## Migration Plan

1. **Step 1 (Backend Contract)**: Update `app/gateway/desc/user.api`, run `just gen-gateway`.
2. **Step 2 (Backend Logic)**: Implement dual-identity aggregation in `app/gateway/internal/logic/user/getuserprofilelogic.go`.
3. **Step 3 (Frontend SDK)**: Run `just gen-ts` to regenerate `@zero/api`.
4. **Step 4 (Portal Refactor)**:
   - Update `apps/portal/src/contexts/InitialStateContext.tsx` (`currentUser?: UserProfileResp | null`).
   - Refactor `apps/portal/src/app.tsx` (`getUserProfile()`).
   - Clean `apps/portal/src/contexts/AuthContext.tsx` (remove `portal_mobile_user`).
   - Refactor `apps/portal/src/access.ts` (remove hardcoded user ID check).
   - Prune `apps/portal/src/services/index.ts` (remove admin API exports).
   - Refactor `apps/portal/src/pages/Workbench/index.tsx` (portal domain APIs).
5. **Step 5 (Verification & Tests)**: Run `just test-frontend` and verify all tests pass.
