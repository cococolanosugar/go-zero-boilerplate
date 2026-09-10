# Frontend Pro Archetypes and DX Specification

## Purpose

Delivers a comprehensive enterprise experience aligning with Ant Design Pro: first-screen PageLoading bootstrapping guard, watermark and compact algorithm toggles, classic page archetypes (Workplace, StepsForm, Advanced Profile, Success Result), ProTable batch operations with CSV export, Ctrl+K spotlight command palette, gateway-backed SSE notifications, and OpenAPI documentation integration.

## Requirements

### Requirement: First-Screen Bootstrapping PageLoading Guard
The application shell SHALL render a full-viewport PageLoading skeleton while global initial state (`initialState.loading`) is resolving, preventing menu flashing and false permission denials.

#### Scenario: Application initial load with pending profile
- **WHEN** the browser loads or refreshes the administration application with a valid token
- **THEN** the system SHALL display the PageLoading component until user profile, permissions, and menu trees are fully populated

### Requirement: Dynamic Watermark and Compact Mode Customization
The layout configuration SHALL support runtime toggles for security watermark and compact token algorithm via the settings drawer with persistent browser storage.

#### Scenario: User toggles security watermark
- **WHEN** the user enables or disables the watermark toggle in SettingDrawer
- **THEN** the system SHALL immediately update the watermark overlay displaying user identification and persist the preference

#### Scenario: User toggles compact algorithm
- **WHEN** the user enables the compact mode switch in SettingDrawer
- **THEN** the ConfigProvider SHALL apply `theme.compactAlgorithm` reducing spacing and padding for high-density information displays

### Requirement: Enterprise Workplace Dashboard Archetype
The system SHALL provide a Workplace page under `/workplace` featuring a personalized user greeting banner, team statistics, ongoing project cards, and recent activity streams.

#### Scenario: User navigates to workplace
- **WHEN** the user accesses the `/workplace` route
- **THEN** the system SHALL render the personalized greeting header with user avatar, project and visit counts, project cards grid, and activity feed

### Requirement: Multi-Step Wizard Form Archetype
The system SHALL provide a canonical multi-step wizard form under `/form/step-form` using ProComponents StepsForm to guide users through sequential stages with form state preservation.

#### Scenario: User completes multi-step transfer wizard
- **WHEN** the user fills step 1 (account), confirms step 2 (review), and submits
- **THEN** the form SHALL progress through validated steps, display step 3 (completion result card), and provide options to repeat or view details

### Requirement: Advanced Profile Detail Archetype
The system SHALL provide an advanced detail page under `/profile/advanced` displaying an order/asset lifecycle steps timeline, ProDescriptions summary, nested ProTable items, and operation audit logs.

#### Scenario: Viewing advanced profile
- **WHEN** an operator navigates to `/profile/advanced`
- **THEN** the system SHALL render the header status, execution progress steps, multi-card descriptions, item list, and historical audit timeline

### Requirement: Operation Success Feedback Result Archetype
The system SHALL provide a dedicated operation success result page under `/result/success` presenting structured task feedback, step progress cards, and follow-up action buttons.

#### Scenario: Viewing success result page
- **WHEN** an operator arrives at `/result/success` after a critical submission
- **THEN** the system SHALL display the Result component with success icon, detail summary, and buttons to return to list or view details

### Requirement: ProTable Batch Alert and CSV Export
The administrative tables SHALL support multi-row selection with an alert action bar and one-click CSV export in the toolbar.

#### Scenario: Operator selects multiple rows in orders table
- **WHEN** the operator checks one or more row checkboxes in the orders table
- **THEN** the table SHALL display the alert banner showing selection count with batch delete and batch export actions

#### Scenario: Operator exports table data to CSV
- **WHEN** the operator clicks the "导出" button in the table toolbar
- **THEN** the browser SHALL download the formatted CSV file representing the table dataset

### Requirement: Global Spotlight Command Palette
The system SHALL provide a global keyboard-driven command palette triggered by `Ctrl+K` or `Cmd+K` enabling fuzzy search across menus, quick action execution, and theme toggling.

#### Scenario: Triggering command palette via shortcut
- **WHEN** the user presses `Ctrl+K` or `Cmd+K` anywhere in the application
- **THEN** the system SHALL open the Spotlight dialog allowing instantaneous fuzzy searching and navigation to matching routes

### Requirement: Gateway Real-Time SSE Notification Streaming
The gateway BFF SHALL expose an SSE streaming endpoint `/api/v1/system/notice/stream` and the frontend NoticeIcon SHALL connect to stream real-time updates.

#### Scenario: Gateway broadcasts real-time notice event
- **WHEN** the gateway emits an SSE message on `/api/v1/system/notice/stream`
- **THEN** the frontend NoticeIcon SHALL receive the payload, append the item to the notification list, and increment the unread badge count

### Requirement: OpenAPI and Swagger Documentation Integration
The system SHALL automate Swagger/OpenAPI contract generation from gateway IDL specifications and provide developer entrypoints in the frontend shell.

#### Scenario: Generating OpenAPI specification
- **WHEN** developer runs `just gen-swagger`
- **THEN** the toolchain SHALL invoke `goctl api swagger` to output a valid OpenAPI contract at `manifest/swagger/gateway.json`

#### Scenario: Accessing API documentation from header
- **WHEN** developer clicks the "API 文档" button in the header toolbar
- **THEN** the application SHALL open the OpenAPI documentation viewer or endpoint
