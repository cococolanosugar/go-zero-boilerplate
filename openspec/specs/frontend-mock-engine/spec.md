# frontend-mock-engine

## Purpose

Provides a standalone, Ant Design Pro-compatible mock data engine embedded in the development server, allowing complete offline prototyping, UI-driven development, and progressive fallback to backend proxies.

## Requirements

### Requirement: Ant Design Pro-Compatible Mock Module Definition
The frontend application SHALL support defining mock endpoints using Ant Design Pro-style route keys formatted as `"METHOD /path"`, accepting both static JSON responses and dynamic handler functions.

#### Scenario: Requesting a static mock endpoint
- **WHEN** a client performs a `GET /api/v1/system/auth/profile` request while mock mode is active
- **THEN** the mock engine SHALL return the pre-configured mock user profile object with HTTP 200 and standard response structure `{ code: 200, msg: "SUCCESS", data: ... }`

#### Scenario: Executing a dynamic mock handler with request inspection
- **WHEN** a client submits login credentials to `POST /api/v1/user/login`
- **THEN** the mock handler SHALL inspect the request body and return success for valid credentials or an error code for invalid credentials

### Requirement: Non-Intrusive Development Server Interception
The mock engine SHALL run strictly inside the local development server middleware and SHALL NOT bundle mock dataset code into production distribution builds.

#### Scenario: Building for production
- **WHEN** the production build command (`pnpm build`) executes
- **THEN** Vite SHALL bundle only application code without bundling mock server middleware or mock datasets

### Requirement: Progressive Proxy Fallback Passthrough
When mock mode is enabled, incoming requests that do not match any defined mock endpoint SHALL automatically fall through to the active Vite proxy target without error.

#### Scenario: Unmatched endpoint passthrough
- **WHEN** a client calls an `/api` endpoint that has no definition in the `mock/` directory
- **THEN** the mock middleware SHALL pass the request along to Vite's proxy pipeline to reach the real backend gateway

### Requirement: Dedicated Offline Execution Modes
The monorepo SHALL provide environment files and scripts allowing developers to start the frontend application in pure mock mode.

#### Scenario: Starting the development server in mock mode
- **WHEN** a developer runs `pnpm dev:mock` or `just run-admin-mock`
- **THEN** Vite SHALL start with `VITE_USE_MOCK=true` and intercept all registered mock endpoints without requiring Go microservice containers
