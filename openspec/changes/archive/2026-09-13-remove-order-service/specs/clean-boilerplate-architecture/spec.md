## Purpose

Defines the clean, lean core platform architecture after decommissioning the mock order microservice, ensuring the boilerplate focuses strictly on user identity, async task workflows, and system governance.

## ADDED Requirements

### Requirement: Decommissioned Order Microservice and Endpoints
The system SHALL permanently decommission the order gRPC microservice and HTTP API routes. Any request to legacy `/api/v1/order/*` endpoints SHALL return HTTP 404 Not Found.

#### Scenario: Calling decommissioned order endpoint
- **WHEN** a client submits an HTTP request to any `/api/v1/order/*` endpoint
- **THEN** the gateway SHALL respond with HTTP status 404 Not Found without routing to any downstream service

### Requirement: Dashboard Overview Metric Aggregation
The gateway `/api/v1/dashboard/overview` endpoint SHALL aggregate the authenticated user's profile and system/task runtime statistics using concurrent `mr.Finish` dispatch, without referencing or requiring order entities.

#### Scenario: Fetching dashboard overview for authenticated user
- **WHEN** an authenticated user accesses the dashboard overview endpoint
- **THEN** the gateway SHALL concurrently fetch the user profile from user RPC and system task metrics, returning unified dashboard overview data with HTTP 200

### Requirement: Clean Navigation and Administrative Layout
The administrative management application SHALL display only core infrastructure and platform governance views, including Dashboard, Task Management, and System Management, without legacy order menu items.

#### Scenario: Administrator navigates menu tree
- **WHEN** an administrator logs into the management portal
- **THEN** the navigation sidebar SHALL render Dashboard, Task Management, and System Management menus, and SHALL NOT display any Order Management entry
