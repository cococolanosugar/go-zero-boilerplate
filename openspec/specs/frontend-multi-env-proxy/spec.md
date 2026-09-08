# frontend-multi-env-proxy

## Purpose

Provides a flexible multi-environment proxy matrix for frontend development servers, enabling seamless switching between local microservices, remote test clusters, and custom LAN targets with real-time forwarding diagnostics.

## Requirements

### Requirement: Structured Multi-Environment Proxy Configuration
The frontend build configurations SHALL organize upstream API proxy definitions into distinct environment profiles (such as `dev`, `test`, and `pre`) managed through dedicated configuration modules.

#### Scenario: Running under standard development mode
- **WHEN** a developer starts the frontend application with `pnpm dev`
- **THEN** the Vite development server SHALL proxy `/api` requests to the local gateway target (`http://127.0.0.1:8888`)

#### Scenario: Running under remote test mode
- **WHEN** a developer starts the frontend application with `pnpm dev:test`
- **THEN** the Vite development server SHALL proxy `/api` requests to the remote test environment gateway with origin header changes enabled

### Requirement: Dynamic Target Overrides via CLI Environment Variables
The frontend development server SHALL allow developers to dynamically override the active proxy target via the `PROXY_TARGET` environment variable without altering committed codebase files.

#### Scenario: Local area network pair debugging
- **WHEN** a developer starts the server with `PROXY_TARGET=http://192.168.1.50:8888 pnpm dev`
- **THEN** the Vite proxy SHALL direct all `/api` traffic to `http://192.168.1.50:8888` regardless of the active environment profile

### Requirement: Proxy Forwarding and Error Observability Logging
The proxy middleware SHALL log outbound request details and network errors in the terminal console during development sessions.

#### Scenario: Forwarding inspection
- **WHEN** an incoming browser request matches the `/api` route prefix
- **THEN** the proxy middleware SHALL log the HTTP method, incoming path, and target destination URL in the server console

#### Scenario: Upstream service failure
- **WHEN** an upstream gateway connection times out or fails to respond
- **THEN** the proxy middleware SHALL log the failure with error diagnostic details to the console without crashing the Vite process

### Requirement: Unified Environment Scripts in Monorepo
The frontend applications and project task runners SHALL expose standardized scripts for multi-environment development across all app packages.

#### Scenario: Executing environment-specific startup
- **WHEN** a developer executes `pnpm dev:test` or `pnpm dev:pre` from an application directory
- **THEN** Vite SHALL load the corresponding mode configuration and connect to the intended gateway environment
