# frontend-service-layer

## Purpose

Provides structured business-domain API service partitioning, unified HTTP and business error interception, and automatic ProTable pagination adaptation for frontend applications.

## Requirements

### Requirement: Domain-Partitioned API Service Organization
The frontend API SDK SHALL organize API call methods by distinct business domains rather than a single monolithic file, while maintaining full backward-compatible root exports.

#### Scenario: Module import by business domain
- **WHEN** a business page or component imports API functions
- **THEN** it SHALL be able to import from active domain-specific service namespaces (such as auth, user, task, and system services) as well as the root SDK package, with decommissioned order services completely removed

### Requirement: Unified Error Interception and User Feedback
The frontend network client SHALL provide an error handling hook mechanism that automatically maps HTTP status codes and business error codes to Ant Design feedback components.

#### Scenario: Business operation error without manual try-catch
- **WHEN** an API call fails with a non-success code or network error and `skipErrorHandler` is false
- **THEN** the unified error handler SHALL automatically display the error message using message or notification components and reject the promise

#### Scenario: Custom error handling override
- **WHEN** an API request explicitly specifies `skipErrorHandler: true`
- **THEN** the unified error handler SHALL suppress automatic UI alerts and delegate exception handling to the caller

### Requirement: ProTable Pagination Request Adaptation
The frontend API layer SHALL provide a request adapter to automatically transform Ant Design ProTable pagination query parameters to backend parameters and convert backend list responses to ProTable table data structures.

#### Scenario: ProTable data query execution
- **WHEN** a ProTable component executes an adapted request function with table pagination and filter arguments
- **THEN** the adapter SHALL transform parameters, invoke the API method, and return `{ data, total, success: true }` without manual mapping boilerplate
