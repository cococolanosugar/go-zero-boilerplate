# frontend-runtime-config

## Purpose

Provides standard Ant Design Pro runtime configuration and lifecycle integration, uncoupling global initial state management and layout slots from view layout components.

## Requirements

### Requirement: Global Initial State Resolution
The frontend application SHALL execute a centralized runtime initialization lifecycle to resolve the global initial state before rendering protected layout components.

#### Scenario: Authenticated user application bootstrap
- **WHEN** a user with a valid authorization token opens the application
- **THEN** the initialization lifecycle SHALL fetch and populate user profile, role lists, and granted permissions into the global initial state

#### Scenario: Unauthenticated visitor bootstrap
- **WHEN** a visitor without a valid authorization token accesses the application
- **THEN** the initialization lifecycle SHALL resolve an unauthenticated initial state without throwing uncaught exceptions and allow login routing

### Requirement: Declarative Runtime Layout Configuration
The layout runtime configuration SHALL define all header actions, user avatar menus, watermarks, and footer properties independently of the layout UI component shell.

#### Scenario: Layout slot derivation
- **WHEN** the application shell layout mounts
- **THEN** it SHALL consume navigation actions, avatar dropdown items, and display metadata directly from the exported runtime layout configuration

### Requirement: Runtime State Mutation and Synchronization
The application SHALL provide a unified state dispatcher to allow components to mutate the global initial state and trigger layout re-renders upon user action.

#### Scenario: User profile update or session expiration
- **WHEN** a user updates their profile or logs out
- **THEN** the initial state dispatcher SHALL update the runtime state and propagate changes to layout avatar, watermarks, and access guards immediately
