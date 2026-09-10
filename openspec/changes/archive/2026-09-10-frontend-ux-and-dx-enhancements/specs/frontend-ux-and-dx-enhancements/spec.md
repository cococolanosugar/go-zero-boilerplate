## Purpose

Defines user experience (UX) and developer experience (DX) enhancements across the frontend applications, encompassing initial load skeletons, ProTable column persistence, sensitive data masking, cross-app shared utility primitives, dirty form navigation interceptors, and public portal SEO metadata.

## ADDED Requirements

### Requirement: Inline HTML Shell Skeleton
The system SHALL display an inline CSS-only shell skeleton within the root DOM node of both `admin` and `portal` applications before JavaScript bundles load and execute.

#### Scenario: Pre-hydration visual shell
- **WHEN** a user visits the admin or portal application in any browser
- **THEN** the initial HTML contains an inline styled skeleton layout (header, sidebar/navigation, and content placeholder) without triggering a blank white screen flash prior to React hydration

### Requirement: ProTable Column State Persistence
The system SHALL persist column visibility, column order, and column width adjustments in browser localStorage across administrative ProTable views.

#### Scenario: Persisting column layout after reload
- **WHEN** an administrator toggles column visibility or adjusts column order in Users, Roles, Orders, Logs, Apis, or Dicts tables
- **THEN** the configuration is stored in localStorage under a dedicated persistence key and restored automatically upon page reload or navigation

### Requirement: Sensitive Data Masking Utilities
The system SHALL provide data masking functions in `@zero/shared` to sanitize phone numbers, email addresses, and identification numbers while preserving prefix and suffix context.

#### Scenario: Masking phone numbers
- **WHEN** a valid or arbitrary phone string is passed to `maskPhone`
- **THEN** the middle digits are replaced with asterisks while retaining the country/area prefix and last digits

#### Scenario: Masking email addresses
- **WHEN** a valid email string is passed to `maskEmail`
- **THEN** the local mailbox part is masked between the leading character and domain separator while keeping the domain intact

#### Scenario: Masking ID cards
- **WHEN** an identification card or citizen number is passed to `maskIdCard`
- **THEN** the middle identification sequence is masked while retaining the first 6 and last 4 characters

### Requirement: Shared Utilities Toolchain
The system SHALL provide cross-browser utility helpers in `@zero/shared` for clipboard copying, function debouncing, throttling, and CSV data export.

#### Scenario: Copy text to clipboard
- **WHEN** `copyToClipboard` is invoked with a text string
- **THEN** the system copies the text to the system clipboard using the modern Clipboard API or falls back to an executive textarea selection when the Clipboard API is unavailable

#### Scenario: Debounce and throttle execution
- **WHEN** rapid repeated function calls are wrapped with `debounce` or `throttle`
- **THEN** the debounced function delays execution until idle duration expires, and the throttled function guarantees execution at most once per defined time window

#### Scenario: Exporting tabular data to CSV
- **WHEN** `exportCsv` is called with column definitions and row records
- **THEN** the system formats the values with BOM prefix and RFC 4180 escaping and initiates a browser file download

### Requirement: Unsaved Form Navigation Guard
The system SHALL intercept route transitions and browser window unload events when a user attempts to leave a form containing unsaved modifications.

#### Scenario: Client-side route transition with dirty form
- **WHEN** a user has modified form values and attempts to navigate to a different route
- **THEN** the navigation is intercepted and a confirmation modal prompts the user before discarding changes

#### Scenario: Browser window closure with dirty form
- **WHEN** a user attempts to close the tab or reload the window while form state is dirty
- **THEN** the browser standard beforeunload prompt is triggered to prevent unintended loss

### Requirement: Portal SEO and OpenGraph Metadata
The system SHALL provide comprehensive meta tags in `apps/portal/index.html` for search engines and social platform link previews.

#### Scenario: Social link preview and search indexing
- **WHEN** a search crawler or social sharing bot requests the portal root URL
- **THEN** the document `<head>` provides title, description, keywords, OpenGraph `og:title`, `og:description`, `og:type`, `og:image`, and Twitter card metadata
