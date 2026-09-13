## Purpose

Provides a centralized enterprise navigation hub in the technical portal for discovering and accessing internal platforms alongside an administration interface to manage navigation links, environment groupings, categorizations, and sorting weights.

## Requirements

### Requirement: Read-Only Portal Navigation Hub
The system SHALL provide a dedicated, responsive navigation page in the Technical Portal (`/navigation`) that displays active enterprise technical sites grouped by environment and category without requiring user authentication.

#### Scenario: Anonymous user views categorized sites
- **WHEN** any user navigates to `/navigation` on the Portal
- **THEN** the system displays all enabled navigation sites grouped by environment (e.g., Common, Prod, Pre, Test, Dev) and category (e.g., Workflow Engines, Service Governance, Dev Tools), showing their icons, titles, descriptions, and tag badges ordered by sort weight descending.

#### Scenario: Environment switcher and dynamic category count
- **WHEN** a user switches between environment segments (e.g., "生产环境 PROD")
- **THEN** the system immediately filters the displayed site cards to that environment and recalculates category counts in real time.

#### Scenario: Real-time keyword search and filtering
- **WHEN** a user enters keywords in the search input box on the navigation page
- **THEN** the system immediately filters the displayed site cards in real time matching the keyword against site titles, URLs, tags, environments, or descriptions.

#### Scenario: Dynamic host interpolation for LAN and remote access
- **WHEN** a navigation site URL contains the dynamic placeholder `{HOST}`
- **THEN** the Portal client interpolates `{HOST}` with the current browser's `window.location.hostname` before rendering or jumping, ensuring accessibility across local loopback, LAN, or remote domain environments.

#### Scenario: External link opening in new tab
- **WHEN** a user clicks on a navigation site card with `target="_blank"`
- **THEN** the browser opens the target URL in a new browser tab and provides a quick-copy action for the URL.

### Requirement: Admin Navigation Datasource Lifecycle Management
The system SHALL provide administrators with full lifecycle management (Create, Read, Update, Delete) of navigation site entries in the Admin console (`/navigation`) protected by RBAC permissions.

#### Scenario: Administrator creates a new navigation site
- **WHEN** an authorized administrator submits the navigation creation form with title, category, environment, target URL, icon, sort weight, target, and status
- **THEN** the system validates the fields, persists the record into `sys_portal_nav`, logs the administrative operation into `sys_oper_log`, and returns HTTP 200 SUCCESS.

#### Scenario: Administrator updates site sort weight, environment, or status toggle
- **WHEN** an administrator modifies the sort weight, environment grouping, or toggles the enabled status switch of an existing site
- **THEN** the system updates the record, invalidates the active navigation cache, and ensures the updated order, grouping, or visibility immediately takes effect.

#### Scenario: Administrator deletes a navigation entry
- **WHEN** an administrator confirms deletion of a navigation site entry
- **THEN** the system removes the entry from `sys_portal_nav`, evicts the cache, and records the deletion audit trail.

#### Scenario: Unauthorized user attempts configuration
- **WHEN** an unauthenticated visitor or a user without `system:navigation:list` attempts to access administrative CRUD endpoints
- **THEN** the system rejects the request with HTTP 401 Unauthorized or HTTP 403 Forbidden.

### Requirement: Cache-Aside Consistency for Portal Navigation
The system SHALL cache enabled navigation sites in Redis to guarantee sub-millisecond retrieval on Portal while ensuring immediate cache invalidation upon administrative mutation.

#### Scenario: Cache hit on portal list request
- **WHEN** Portal requests `GET /api/v1/portal/navigation/list` and valid cached data exists in Redis
- **THEN** the gateway returns the cached navigation dataset directly without hitting the database.

#### Scenario: Precision eviction on administrative modification
- **WHEN** an administrator creates, updates, or deletes any navigation record via the admin API
- **THEN** the User microservice atomically mutates the database and invalidates the navigation cache key, ensuring subsequent portal requests fetch fresh records.
