## Purpose

Provides automated domain-partitioned API code generation across backend Go data transfer objects and frontend TypeScript SDK clients, driven by API contracts and OpenAPI specifications.

## Requirements

### Requirement: Backend Gateway DTO Modular Partitioning
The code generation toolchain SHALL partition backend gateway request and response types into dedicated domain files corresponding to their API group declarations, maintaining backward compatibility in the `types` package.

#### Scenario: Generating gateway types with type-group enabled
- **WHEN** the developer executes `just gen-gateway`
- **THEN** gateway DTOs are partitioned into domain-specific files (`user.go`, `system.go`, `dict.go`, `dashboard.go`, `sys_dept.go`, `sys_nav.go`, `sys_notice.go`, `sys_post.go`, `system_task.go`, `portal_nav.go`, `types.go`) under `app/gateway/internal/types/`, and all existing handler/logic references compile without import changes

### Requirement: Frontend OpenAPI-Driven Modular Client Generation
The frontend SDK generation pipeline SHALL generate domain-partitioned TypeScript API modules and data models from the gateway OpenAPI contract, with automated Tag/group splitting.

#### Scenario: Generating frontend SDK via OpenAPI pipeline
- **WHEN** the developer executes `just gen-ts`
- **THEN** the system exports the OpenAPI specification from `app/gateway/desc/gateway.api` and generates modular TypeScript clients under `src/endpoints/` and data models under `src/model/`

### Requirement: Unified HTTP Client Mutator Bridging
The generated frontend API client functions SHALL bridge to the shared Axios instance to automatically inherit JWT Bearer token authentication, 401 unauthenticated interceptor dispatching, and standard response unwrapping.

#### Scenario: Executing generated API client method
- **WHEN** a frontend component or test invokes an auto-generated API method
- **THEN** the request passes through the shared Axios client instance, attaches the active JWT Bearer token if present, and unwraps the payload data upon successful response

#### Scenario: Intercepting unauthorized status in generated client
- **WHEN** an auto-generated API method receives an HTTP 401 Unauthorized response
- **THEN** the shared interceptor triggers the unauthorized handler event without requiring manual error interception in the calling code
