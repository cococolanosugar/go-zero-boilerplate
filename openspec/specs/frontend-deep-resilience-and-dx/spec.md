# frontend-deep-resilience-and-dx Specification

## Purpose
Provides comprehensive frontend resilience, developer experience, and monorepo code reuse across admin and portal applications without altering backend services.

## Requirements

### Requirement: Request Timeout Protection
The HTTP request client SHALL support a configurable request timeout (defaulting to 30000 milliseconds) and abort requests exceeding this duration with a standardized error code and message.

#### Scenario: Request completes within timeout
- **WHEN** an HTTP request completes before the configured timeout expires
- **THEN** the client returns the successful API response without aborting

#### Scenario: Request exceeds timeout threshold
- **WHEN** an HTTP request takes longer than the timeout period
- **THEN** the request is aborted and an ApiError with code -3 and message '请求超时，请检查网络' is rejected

#### Scenario: Caller provides custom abort signal
- **WHEN** a caller provides an external AbortSignal and triggers abortion before timeout
- **THEN** the request aborts immediately respecting the caller's cancellation signal

### Requirement: Login Redirection Route Preservation
The authentication login flow SHALL capture the intended destination path from URL query parameters (`?from=...`) or router state and redirect the authenticated user to that path upon successful login.

#### Scenario: Unauthenticated access redirect to login with query param
- **WHEN** an unauthenticated user accesses a protected path `/system/users` and is redirected to `/login?from=%2Fsystem%2Fusers`
- **THEN** upon successful login, the application redirects the user to `/system/users` instead of the default `/dashboard`

#### Scenario: Direct login without redirect parameter
- **WHEN** a user navigates directly to `/login` without any `from` query param or router state
- **THEN** upon successful login, the application redirects the user to `/dashboard`

### Requirement: Monorepo Shared Storage and Download Utilities
Common client utilities for namespaced TTL storage and browser file downloads SHALL be centralized in `@zero/shared` and re-exported uniformly by application packages.

#### Scenario: Namespaced storage with TTL expiration
- **WHEN** a value is stored in `SafeStorage` with an expiration timestamp in the past
- **THEN** reading the key returns `null` or the fallback default value and removes the expired item from storage

#### Scenario: File download from blob and content disposition
- **WHEN** a file blob response is passed to `downloadBlob` with a target filename
- **THEN** a temporary anchor element is created and clicked, triggering browser download and cleaning up object URL references

### Requirement: MultiTabs Session Persistence and Directional Closing
The admin application's multi-tab workspace SHALL persist open tabs across browser page refreshes within the same session and support closing all tabs to the right of the active tab.

#### Scenario: Page refresh restores active tabs
- **WHEN** a user opens multiple tabs and refreshes the browser page
- **THEN** the previously open tabs and their active selection are restored from session storage

#### Scenario: Close tabs to the right
- **WHEN** a user selects "关闭右侧标签页" on an active tab
- **THEN** all tabs positioned to the right of the active tab are closed while preserving the active tab and tabs to its left

### Requirement: Dynamic CommandPalette Route Indexing
The global command palette SHALL dynamically index accessible navigation routes from the route definitions with i18n titles and permission checks rather than static hardcoded items.

#### Scenario: User searches for registered route in CommandPalette
- **WHEN** a user opens the command palette (Cmd+K / Ctrl+K) and enters a search keyword matching a route title or path
- **THEN** matching route entries are displayed with their configured title and icons, allowing keyboard navigation to that route

### Requirement: Offline Network Guard
The application SHALL detect offline network status via browser events and display a visible banner alert informing the user of the disconnected status, automatically clearing upon reconnection.

#### Scenario: Network connection is lost
- **WHEN** the browser `offline` event fires
- **THEN** a persistent warning banner is displayed alerting the user of offline status

#### Scenario: Network connection is restored
- **WHEN** the browser `online` event fires
- **THEN** the offline warning banner is automatically dismissed and a reconnection notification is displayed

### Requirement: Self-Hosted Login Logo and Dark Mode Chart Theme
Frontend visual assets SHALL rely on local self-hosted assets for login branding, and portal charts SHALL adapt their visual theme according to the active dark mode setting.

#### Scenario: Login page renders branding logo
- **WHEN** the login page renders
- **THEN** the logo image loads from local asset `/favicon.svg` instead of an external CDN URL

#### Scenario: Portal dashboard toggles dark mode
- **WHEN** the user switches between dark and light themes in portal
- **THEN** the `@ant-design/charts` component updates its theme parameter between `classicDark` and `classic`
