## Why

The current portal frontend application relies on an artificial and parasitic identity model:
1. **Parasitic Profile Endpoint**: The portal calls the backend admin API `GET /api/v1/system/user/profile` (`getAdminProfile`), which queries the internal employee table `sys_user`. External customer users (mobile phone/SMS login recorded in `user` table) receive a 404/Not Found error when attempting to fetch their profile.
2. **Client-Side Fake Profile Fabrication**: To circumvent the 404 failure for mobile customers, the portal client injects a synthetic dummy user object (`{ id: 0, roles: ["ROLE_USER"] }`) into `localStorage` (`portal_mobile_user`) and bypasses backend identity resolution entirely.
3. **Admin Privilege API Leakage in Portal Bundle**: The portal service layer (`apps/portal/src/services/index.ts`) re-exports high-privilege administrative clients (`systemUsersApi`, `systemRolesApi`, `systemMenusApi`, `systemApisApi`, `systemLogsApi`), and the portal Workbench demonstration page calls `getSysMenuTree` and `listSysApis`, blurring the security and domain boundaries between the back-office admin system and the public/customer technical portal.

Addressing this now establishes a unified, server-authoritative user profile contract across all client tiers and enforces clean domain isolation between the admin and portal applications.

## What Changes

- **Backend Gateway User Profile Contract (`user.api`)**:
  - Add `UserProfileResp` DTO and `GET /api/v1/user/profile` endpoint into `app/gateway/desc/user.api`.
  - Implement `GetUserProfileLogic` to intelligently resolve dual-table identity: inspect caller's `userId` from JWT claims, prioritize internal staff profile (`GetAdminProfile` -> `userType: "employee"`), and fall back to external customer profile (`GetUserInfo` -> `userType: "customer"`).
- **Portal Initial State & Identity Decoupling**:
  - Update `InitialStateContext` in the portal to type `currentUser` as `UserProfileResp` rather than `AdminProfileResp`.
  - Refactor `getInitialState()` in `apps/portal/src/app.tsx` to query `getUserProfile()` from `@zero/api`.
  - Completely eliminate `portal_mobile_user` local storage mocking and dummy object injection in `AuthContext.tsx`.
- **Portal Service Layer & Page Pruning**:
  - Prune administrative management API instances (`systemUsersApi`, `systemRolesApi`, `systemMenusApi`, `systemApisApi`, `systemLogsApi`) from `apps/portal/src/services/index.ts`.
  - Refactor `apps/portal/src/pages/Workbench/index.tsx` to consume portal-relevant endpoints (`getDashboardOverview`, `getUserProfile`, `getPortalNavList`) instead of admin menu and API dictionary endpoints.
  - Align portal `access.ts` permissions with server-returned roles without relying on hardcoded admin user IDs.

## Capabilities

### New Capabilities
- `portal-identity`: Defines the unified server-authoritative user profile aggregation contract and client identity lifecycle for portal and multi-tier clients, strictly isolating public and customer experiences from back-office management interfaces.

### Modified Capabilities
<!-- None -->

## Impact

- **Backend Gateway (`app/gateway`)**:
  - `desc/user.api`: Added `UserProfileResp` type and `GET /api/v1/user/profile` route under `group: user`.
  - `internal/logic/user/getuserprofilelogic.go`: Dual-identity resolution and aggregation logic calling `UserRpc`.
- **Frontend Shared SDK (`@zero/api`)**:
  - Automatically regenerated via `just gen-ts` with new `getUserProfile` API and `UserProfileResp` model.
- **Frontend Portal Application (`apps/portal`)**:
  - `src/contexts/InitialStateContext.tsx`: Model typed to `UserProfileResp`.
  - `src/app.tsx`: Server-driven `getInitialState()` without dummy fallback.
  - `src/contexts/AuthContext.tsx`: Cleaned of fake localStorage profile writes.
  - `src/access.ts`: Decoupled from hardcoded user IDs.
  - `src/services/index.ts`: Pruned admin management API exports.
  - `src/pages/Workbench/index.tsx`: Updated demo cards to display portal domain data.
- **Automated Tests**:
  - Vitest test suite in `apps/portal` covering initial state, auth context, access rules, and service exports.
