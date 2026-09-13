## Why

As the fullstack codebase scales, monolithic API code generation creates significant maintenance friction:
1. **Backend Types Monolith**: `goctl api go` currently bundles all gateway request/response DTOs into a single `app/gateway/internal/types/types.go` file (over 800 lines), making code navigation, code review, and concurrent multi-developer feature branching prone to merge conflicts.
2. **Frontend Monolithic SDK**: `goctl api ts` produces a monolithic `gateway.ts` (540+ lines) and `gatewayComponents.ts` (830+ lines). This mixes internal back-office management endpoints with public and customer portal endpoints, prevents clean domain-driven tree-shaking, and complicates architectural boundary enforcement.

Adopting automated modular splitting on both ends—leveraging go-zero's native `--type-group` for Go DTOs and an OpenAPI-driven pipeline (Option C with Orval) for TypeScript—guarantees domain-partitioned, maintainable, and contract-synchronized code generation.

## What Changes

- **Backend Gateway DTO Modular Splitting**:
  - Update `justfile` `gen-gateway` target to include `--type-group`.
  - Automatically partition `app/gateway/internal/types/` into domain-specific files (`user.go`, `system.go`, `dict.go`, `dashboard.go`, `sys_dept.go`, `sys_nav.go`, `sys_notice.go`, `sys_post.go`, `system_task.go`, `portal_nav.go`, and shared `types.go`).
  - Maintain 100% backward compatibility within `package types` without requiring any import changes in existing handlers or logic files.
- **Frontend OpenAPI-Driven Modular Codegen (Option C)**:
  - Add `orval` as a developer dependency in `frontend/packages/api`.
  - Configure `orval.config.ts` with `mode: 'tags-split'` to generate domain-partitioned API client files under `frontend/packages/api/src/endpoints/` and typed data models under `frontend/packages/api/src/model/`.
  - Implement a custom Axios instance mutator (`custom-instance.ts`) that bridges existing JWT Bearer token authentication, 401 unauthenticated interceptor dispatching, and `pkg/result` format unwrapping.
  - Update `justfile` `gen-ts` to orchestrate `goctl api swagger` and `orval` into an atomic one-command workflow.
  - Retain top-level facade exports in `frontend/packages/api/src/index.ts` ensuring zero regressions for existing consumer applications (`apps/admin` and `apps/portal`).

## Capabilities

### New Capabilities
- `modular-api-codegen`: Establishes the automated, domain-partitioned code generation pipeline for backend Go DTOs and frontend TypeScript client modules, driven by API contracts and OpenAPI specifications.

### Modified Capabilities
<!-- None -->

## Impact

- **Build Tooling (`justfile`, `package.json`)**:
  - `justfile`: `gen-gateway` enhanced with `--type-group`; `gen-ts` upgraded to OpenAPI + Orval pipeline.
  - `frontend/packages/api/package.json`: added `orval` devDependency and scripts.
- **Backend Gateway (`app/gateway/internal/types`)**:
  - `types.go` split into modular domain files.
- **Frontend Shared SDK (`@zero/api`)**:
  - Generated domain endpoint files under `src/endpoints/` and models under `src/model/`.
  - Custom mutator bridging `src/custom-instance.ts`.
  - Preserved backward-compatible root exports in `src/index.ts`.
- **Frontend Applications (`apps/admin`, `apps/portal`)**:
  - Full build and test verification ensuring 100% compatibility.
