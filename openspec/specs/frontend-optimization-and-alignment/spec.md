# Frontend Optimization and Alignment Specification

## Purpose

Delivers high-impact frontend optimizations aligning with enterprise standards across both admin and portal applications without backend changes: granular Vite production chunk splitting (eliminating 1MB+ bundles), modern ModalForm/DrawerForm archetypes, request-level AbortController anti-race cancellation, and cross-tab session/preference synchronization.

## Requirements

### Requirement: Aligned Granular Vite Production Chunk Splitting
The build configuration for both administrative and portal frontends SHALL partition third-party vendor dependencies into discrete, cacheable chunks below 1MB without circular dependency warnings.

#### Scenario: Building production assets for admin and portal
- **WHEN** the developer executes `just build-frontend` or `pnpm build`
- **THEN** the Vite bundler SHALL emit dedicated chunks for React runtime (`vendor-react`), Ant Design core/cssinjs (`vendor-antd-core`), Ant Design components (`vendor-antd`), and ProComponents (`vendor-pro`) with no chunk exceeding the warning threshold

#### Scenario: Selective cache preservation on code updates
- **WHEN** application business logic is modified and rebuilt
- **THEN** client browsers SHALL retain cached vendor bundles without re-downloading core frameworks

### Requirement: Modern Modal and Drawer Form Archetype
Administrative management pages SHALL support ProComponents ModalForm and DrawerForm with declarative button triggers, automatic lifecycle management, and built-in submission loading states.

#### Scenario: Operator triggers user/role creation or edit form
- **WHEN** an operator clicks the create or edit action button
- **THEN** the system SHALL open the declarative ModalForm or DrawerForm with clean form reset and automatic focus on the primary input

#### Scenario: Form submission and automatic closure
- **WHEN** the operator submits valid form data
- **THEN** the form SHALL show submit loading, invoke the API service, trigger notification, automatically dismiss the dialog, and refresh the underlying table without manual visibility state management

### Requirement: Network Resilience and Stale Request Abort
The frontend HTTP client and routing layers SHALL support AbortSignal integration to automatically terminate pending stale requests upon navigation or rapid filtering.

#### Scenario: User navigates away before request completes
- **WHEN** a user triggers a route transition while HTTP data fetching is still pending
- **THEN** the system SHALL abort all in-flight requests bound to the departing route, preventing CPU/memory leakage and stale state updates

#### Scenario: Fast pagination or repeated search filtering
- **WHEN** an operator rapidly changes table pages or search filters before the previous response arrives
- **THEN** the table request adapter SHALL cancel preceding pending queries, ensuring only the latest response is committed to the view

### Requirement: Multi-Tab Session and Preference Synchronization
Authentication revocation and global preferences SHALL synchronize instantaneously across all open browser tabs within the same origin.

#### Scenario: Logout in one tab synchronizes across all open tabs
- **WHEN** the user clicks logout or token expiration occurs in any browser tab
- **THEN** all other active browser tabs for that application SHALL immediately detect credential removal and redirect to the login screen

#### Scenario: Theme or locale update synchronizes across all open tabs
- **WHEN** the user updates the visual theme mode (light/dark) or locale language in one tab
- **THEN** all sibling tabs of that application SHALL immediately apply the updated preference without requiring a manual refresh
