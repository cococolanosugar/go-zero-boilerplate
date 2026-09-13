## ADDED Requirements

### Requirement: Top-Level Route Grouping
The frontend routing system SHALL organize administrative system and governance pages into distinct top-level domains and standalone entry points: `/org` (Organization Management), `/permission` (IAM & Access Control), `/notice` (Announcements & Notice Center), `/system` (Platform Settings), and `/monitor` (System Monitoring).

#### Scenario: Navigating to distinct administrative domains
- **WHEN** an authenticated user opens the navigation menu
- **THEN** the system SHALL display `/org`, `/permission`, `/notice`, `/system`, and `/monitor` with dedicated icons and localized titles

### Requirement: Transparent Legacy Route Redirection
The frontend routing system SHALL provide transparent client-side redirection for historical and intermediate route paths to preserve bookmarks, links, and browser history.

#### Scenario: Accessing legacy department route
- **WHEN** a user navigates to `/system/dept` or `/permission/dept`
- **THEN** the system SHALL redirect to `/org/dept` without rendering an error or 404 page

#### Scenario: Accessing legacy post route
- **WHEN** a user navigates to `/system/sys-post` or `/permission/sys-post`
- **THEN** the system SHALL redirect to `/org/post` without rendering an error or 404 page

#### Scenario: Accessing legacy employee user route
- **WHEN** a user navigates to `/system/users` or `/permission/users`
- **THEN** the system SHALL redirect to `/org/users` without rendering an error or 404 page

#### Scenario: Accessing legacy notice route
- **WHEN** a user navigates to `/system/sys-notice` or `/sys-notice`
- **THEN** the system SHALL redirect to `/notice` without rendering an error or 404 page

#### Scenario: Accessing legacy role or menu routes
- **WHEN** a user navigates to `/system/roles` or `/system/menus`
- **THEN** the system SHALL redirect to `/permission/roles` or `/permission/menus` respectively
