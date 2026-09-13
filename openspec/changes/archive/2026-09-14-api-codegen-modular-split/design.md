## Context

The repository currently utilizes `goctl` for fullstack API code generation:
- Backend: `goctl api go` compiles `app/gateway/desc/gateway.api` into handlers, logic, and a single monolithic `internal/types/types.go` file (over 800 lines).
- Frontend: `goctl api ts` compiles `app/gateway/desc/gateway.api` into a single monolithic `gateway.ts` (540+ lines) and `gatewayComponents.ts` (830+ lines).

While backend logic and handlers are already structured by API groups (`user`, `system`, `dashboard`, etc.), types and frontend clients remain monolithic.

See `proposal.md` for background and problem motivation.

## Goals / Non-Goals

**Goals:**
- **Backend DTO Modularization**:
  - Update `just gen-gateway` to use `--type-group`.
  - Automatically partition `app/gateway/internal/types/` into domain-specific files (`user.go`, `system.go`, `dict.go`, `dashboard.go`, `sys_dept.go`, `sys_nav.go`, `sys_notice.go`, `sys_post.go`, `system_task.go`, `portal_nav.go`, and shared `types.go`).
  - Maintain 100% backward compatibility in `package types`.
- **Frontend OpenAPI-Driven Modular Codegen (Option C)**:
  - Establish an automated pipeline using `orval` driven by `manifest/swagger/gateway.json`.
  - Partition generated client functions by tags into `src/endpoints/` and models into `src/model/`.
  - Provide a custom Axios instance mutator (`custom-instance.ts`) bridging JWT Bearer authorization, 401 unauthenticated interceptor dispatching, and standard response unwrapping.
  - Consolidate generation into `just gen-ts` so developers run a single command to produce modular TypeScript clients.
  - Preserve root exports in `src/index.ts` for seamless backward compatibility across `apps/admin` and `apps/portal`.
  - Ensure 100% test pass rate and clean production builds.

**Non-Goals:**
- Forcing frontend components to use React Query hooks (Axios client methods remain the default).
- Modifying backend route paths, HTTP methods, or business logic.

## Decisions

### Decision 1: Use Native go-zero `--type-group` for Go DTOs
- **Choice**: Add `--type-group` to `goctl api go` in `justfile`.
- **Rationale**: Built-in to go-zero, requires zero third-party dependencies, groups DTOs by `@server (group: ...)` automatically, and keeps all files in `package types` so no caller imports change.
- **Alternatives Considered**: Writing custom AST parsing script. Rejected as unnecessary given native support.

### Decision 2: Use Orval for Frontend OpenAPI Code Generation (Option C)
- **Choice**: Integrate `orval` with `mode: 'tags-split'` in `frontend/packages/api`.
- **Rationale**: Industry standard for OpenAPI-to-TypeScript generation with active maintenance, tree-shaking support, robust TypeScript type output, and native custom mutator support for Axios.
- **Alternatives Considered**:
  - *Option A (Manual Facades)*: High maintenance overhead; developers must update facade files whenever endpoints change.
  - *Option B (Ad-hoc regex splitting script)*: Fragile on syntax variations; lacks deep TypeScript AST awareness.

### Decision 3: Custom Axios Mutator Bridge
- **Choice**: Configure Orval's `override.mutator` pointing to `src/custom-instance.ts`.
- **Rationale**: Bridges Orval's generated request calls with the repository's existing Axios instance, preserving token injection (`getToken()`), 401 unauthenticated event dispatching, and automatic result unwrapping (`res.data`).

### Decision 4: Backward Compatibility via Root Re-exports
- **Choice**: Re-export all endpoint functions and models from `frontend/packages/api/src/index.ts`.
- **Rationale**: Avoids massive churn across existing component files in `apps/admin` and `apps/portal`, allowing gradual adoption of direct domain imports (`@zero/api/endpoints/user`) while immediately delivering modular code generation.

## Risks / Trade-offs

- **[Risk] Swagger operation tagging consistency**: `goctl api swagger` generates `operationId` prefixed with the group name (e.g. `userGetUserProfile`).
  - **Mitigation**: Configure Orval or a lightweight swagger tag normalizer ensuring operations map to clean tag names (`user`, `system`, `dashboard`, `dict`, `task`, `navigation`).
- **[Risk] Monorepo build and package dependency resolution**:
  - **Mitigation**: Install `orval` directly in `frontend/packages/api` with pnpm, ensuring versions are locked in `pnpm-lock.yaml`.

## Migration Plan

1. **Step 1 (Backend)**: Add `--type-group` to `justfile` `gen-gateway`, run generation, and verify `app/gateway` compiles.
2. **Step 2 (Frontend Dependencies)**: Install `orval` in `frontend/packages/api`, configure `orval.config.ts` and `custom-instance.ts`.
3. **Step 3 (Pipeline Integration)**: Update `justfile` `gen-ts` to execute swagger generation followed by orval generation.
4. **Step 4 (Facade & Compatibility)**: Update `frontend/packages/api/src/index.ts` to re-export modular endpoints and models.
5. **Step 5 (Verification)**: Run `just test-frontend`, `pnpm --filter @zero/portal build`, and `pnpm --filter @zero/admin build`.
