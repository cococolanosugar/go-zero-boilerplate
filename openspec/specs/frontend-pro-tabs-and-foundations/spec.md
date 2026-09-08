# frontend-pro-tabs-and-foundations

## Purpose

Delivers an enterprise-grade exception page matrix (404 & 500), universal sleek scrollbar styling, frontend-specific constants management, and a configurable multi-tabs navigation system aligned with Ant Design Pro standards.

## Requirements

### Requirement: Complete Exception Page Matrix
The frontend application SHALL provide dedicated, localized visual exception pages for HTTP 404 (Not Found) and HTTP 500 (Internal Server Error) with contextual guidance and action buttons.

#### Scenario: Navigating to an unmapped route
- **WHEN** an operator accesses a path that does not match any valid route pattern
- **THEN** the router SHALL render the 404 exception view with a "Back Home" navigation button

#### Scenario: Server error failure state
- **WHEN** an internal system fault or network timeout triggers navigation to the 500 error view
- **THEN** the page SHALL display the 500 error layout with a "Retry" or "Reload" action button

### Requirement: Cross-Browser Refined Global Styling
The application shell SHALL enforce customized 6px rounded scrollbars across the entire viewport and scrollable sub-containers that dynamically harmonize with the active light and dark themes.

#### Scenario: Scrolling content on desktop browsers
- **WHEN** a view contains overflow content requiring vertical or horizontal scrolling
- **THEN** the browser SHALL render a subtle 6px rounded scrollbar that highlights on hover and matches the theme background

### Requirement: Application-Level Constants Consolidation
The administration application SHALL maintain a centralized constants registry under `src/constants/index.ts` for client-only storage keys, default pagination values, and tab configuration constants.

#### Scenario: Retrieving a client-only configuration constant
- **WHEN** a component or service accesses standard storage keys or default pagination options
- **THEN** it SHALL consume values exported from the centralized constants directory rather than raw string literals

### Requirement: Configurable Multi-Tabs Navigation System
The main administration layout SHALL provide a multi-tabs browsing bar tracking opened pages, allowing operators to switch, close, and manage concurrent page contexts with a toggleable layout setting.

#### Scenario: Opening and switching navigation tabs
- **WHEN** an operator navigates through multiple authorized admin pages
- **THEN** the multi-tabs bar SHALL append tab chips for each route, highlight the active tab, and switch routes upon clicking

#### Scenario: Closing tab contexts
- **WHEN** an operator selects "Close Current", "Close Others", or "Close All" from a tab dropdown
- **THEN** the system SHALL remove the corresponding tabs and navigate to the remaining active or default dashboard tab

#### Scenario: Toggling multi-tabs visibility
- **WHEN** the `tabsLayout` setting is disabled in configuration or settings drawer
- **THEN** the layout SHALL hide the multi-tabs bar and operate in pure single-page view mode
