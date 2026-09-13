## Purpose

Provides a unified, server-authoritative identity aggregation model and strict service boundaries for portal and consumer-facing applications, eliminating client-side dummy identity fabrication and administrative API leakage.

## ADDED Requirements

### Requirement: Server-Authoritative Dual-Identity User Profile Resolution
The backend gateway SHALL provide a unified, authenticated `GET /api/v1/user/profile` endpoint that aggregates profile information across internal staff (`sys_user`) and external customer (`user`) records based on caller JWT claims.

#### Scenario: Staff member requests user profile
- **WHEN** an authenticated user possessing an internal staff record requests `GET /api/v1/user/profile`
- **THEN** the gateway returns HTTP 200 with `userType` equal to `"employee"`, populated department name, real name, email, avatar, and assigned system role codes

#### Scenario: External customer requests user profile
- **WHEN** an authenticated customer lacking an internal staff record requests `GET /api/v1/user/profile`
- **THEN** the gateway resolves the customer entity from the user database and returns HTTP 200 with `userType` equal to `"customer"`, masked phone number, default customer role (`"ROLE_USER"`), and department name set to `"业务客户"`

#### Scenario: Unauthenticated request to user profile endpoint
- **WHEN** a client calls `GET /api/v1/user/profile` without a valid JWT bearer token
- **THEN** the gateway rejects the request with HTTP 401 Unauthorized

### Requirement: Zero-Fabrication Portal Client Identity Lifecycle
The portal frontend application SHALL maintain its current user identity strictly from server-authoritative profile endpoints, and SHALL NOT synthesize or persist mock dummy profile objects in local storage.

#### Scenario: Portal app initializes global state with authenticated token
- **WHEN** the portal application boots up with an existing valid authentication token
- **THEN** the initialization pipeline calls `getUserProfile()` from the shared API client and populates the global `currentUser` state with the returned `UserProfileResp` entity

#### Scenario: Portal user logs in via mobile SMS verification
- **WHEN** a user completes SMS verification and obtains an access token via `loginAsMobile`
- **THEN** the portal client stores the access token, refreshes the global state via `getUserProfile()`, and does NOT write any artificial `portal_mobile_user` object into `localStorage`

#### Scenario: Portal user logs out
- **WHEN** an authenticated portal user triggers the logout flow
- **THEN** the portal client clears authentication tokens and resets `currentUser` to `null` without leaving residual mocked user objects in browser storage

### Requirement: Strict Portal Public and Protected API Service Boundary
The portal application service layer SHALL expose only portal-relevant public and customer domain APIs, and SHALL NOT export internal back-office administration management services.

#### Scenario: Portal modules import service instances
- **WHEN** portal pages and components import API clients from `@/services`
- **THEN** only customer-facing domain services (`authApi`, `dashboardApi`, `navigationApi`, `taskApi`, `userApi`) are accessible, and administrative services (`systemUsersApi`, `systemRolesApi`, `systemMenusApi`, `systemApisApi`, `systemLogsApi`) are excluded

#### Scenario: Portal access control evaluation
- **WHEN** the portal evaluates user route and component permissions via `access.ts`
- **THEN** permissions are determined purely from the server-validated roles array on `currentUser`, without evaluating hardcoded user IDs (such as `userId === 1`)
