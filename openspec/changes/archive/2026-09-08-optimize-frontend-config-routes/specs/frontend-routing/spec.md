## Purpose

Provides declarative compile-time route configuration, on-demand code splitting with lazy loading, and unified runtime layout integration across all frontend applications (admin and portal).

## ADDED Requirements

### Requirement: Declarative Route Configuration
The frontend applications SHALL define all application routes using a centralized declarative configuration object specifying path, lazy-loaded component, page title/locale key, icon, and optional nested child routes.

#### Scenario: Route table compilation
- **WHEN** the application boots or route changes occur
- **THEN** the system SHALL resolve routing structure from the declarative route table without hardcoded JSX route elements

### Requirement: On-demand Page Component Lazy Loading
The routing system SHALL load page-level component chunks on demand via dynamic import and display a fallback loading state during chunk fetching.

#### Scenario: First access to an unvisited route
- **WHEN** the user navigates to a new page route
- **THEN** the application SHALL show a loading skeleton or spinner while dynamically downloading the page chunk and mount the page upon completion

### Requirement: Unified Layout Route Synchronization
The application shell layouts (ProLayout in admin and portal) SHALL consume the declarative route configuration directly as their menu data source to eliminate duplicate route and menu declarations.

#### Scenario: Layout menu rendering
- **WHEN** the layout component renders the navigation menu
- **THEN** it SHALL derive navigation items, breadcrumbs, and active states directly from the shared route configuration tree
