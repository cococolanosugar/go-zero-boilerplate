## 1. Backend Gateway DTO Modular Splitting

- [x] 1.1 Update `justfile` `gen-gateway` target to append `--type-group` and run generation, verifying domain files are generated under `app/gateway/internal/types/`
- [x] 1.2 Verify backend gateway compilation with `go build ./app/gateway/...` and ensure all handlers and logic files compile without errors

## 2. Frontend OpenAPI Tooling & Orval Configuration

- [x] 2.1 Add `orval` to `frontend/packages/api/package.json` devDependencies and install dependencies via `pnpm install`
- [x] 2.2 Create `frontend/packages/api/src/custom-instance.ts` implementing the custom Axios mutator with JWT Bearer token attachment, 401 unauthenticated event dispatching, and response data unwrapping
- [x] 2.3 Create `frontend/packages/api/orval.config.ts` configuring `mode: 'tags-split'` targeting `src/endpoints/` and `src/model/` with custom mutator

## 3. OpenAPI Pipeline Automation & SDK Generation

- [x] 3.1 Enhance `justfile` `gen-ts` target to orchestrate swagger generation and `orval` execution, verifying that domain files are produced in `src/endpoints/` and `src/model/`
- [x] 3.2 Update `frontend/packages/api/src/index.ts` to re-export endpoints, models, and services for seamless backward compatibility

## 4. Verification & Testing

- [x] 4.1 Run `just test-frontend` to verify 100% test pass rate across the frontend workspace
- [x] 4.2 Run `pnpm --filter @zero/portal build` and `pnpm --filter @zero/admin build` to verify clean production builds
- [x] 4.3 Run `just lint-antd` to verify zero lint errors and zero deprecated API usage
