# frontend-pro-enhancements

## Purpose

Provides enterprise frontend capabilities including page-level error boundaries, in-app notification center, dynamic theme color token customization, and standardized asynchronous request management aligned with Ant Design Pro standards.

## Requirements

### Requirement: Page-Level React Error Boundary Protection
The system SHALL provide an ErrorBoundary wrapper at the routing level to capture uncaught React rendering exceptions and render a graceful fallback UI without crashing the global application shell.

#### Scenario: Page rendering throws an uncaught JavaScript error
- **WHEN** a page component encounters an unexpected runtime error or dirty data failure
- **THEN** the system SHALL display a local error result card with error details and a retry button, keeping navigation, header actions, and sidebar intact

#### Scenario: User clicks retry on error card
- **WHEN** user clicks the "重试本页面" button on the error boundary fallback view
- **THEN** the system SHALL reset the error state and attempt to remount the target page component

### Requirement: Enterprise Header Notification Popover Center
The system SHALL provide a NoticeIcon popover in the header navigation bar supporting structured notification tabs with badge counts and read-state management.

#### Scenario: User views unread notifications
- **WHEN** user clicks the notification bell icon in the header
- **THEN** the system SHALL render a popover containing "通知", "消息", and "待办" tab lists with item titles, timestamps, and status badges

#### Scenario: User clears notifications or marks as read
- **WHEN** user clicks the "清空" button in the active notification tab
- **THEN** the system SHALL clear unread items in that category and update the header badge count accordingly

### Requirement: Dynamic Theme Palette and Token Customization
The system SHALL support dynamic runtime switching among multiple curated enterprise color palettes via the layout settings drawer, immediately updating Ant Design design tokens.

#### Scenario: User selects a new primary color palette
- **WHEN** user opens the SettingDrawer and selects an accent color (e.g. 极客绿 or 酱紫)
- **THEN** the system SHALL update `colorPrimary` in `ConfigProvider` token configuration and persist the preference in localStorage

### Requirement: Standardized Async Request State Management
The system SHALL provide unified asynchronous request hooks via ahooks `useRequest` for non-table interactions, standardizing loading states, debouncing, and lifecycle callbacks.

#### Scenario: Executing asynchronous mutation with debounce
- **WHEN** a client interaction triggers a data submission or search action
- **THEN** the system SHALL provide reactive `loading`, `data`, and `error` states with built-in cancellation and debouncing
