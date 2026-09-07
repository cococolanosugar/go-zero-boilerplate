## Context

Currently, all frontend API functions generated from go-zero contracts are exported directly from a single monolithic file (`gateway.ts`) in `@zero/api`. Furthermore, API requests lack interceptor hooks and unified error handling, requiring page components across `admin` and `portal` to manually catch errors, display `message.error()`, and map pagination formats for ProTable.

This design establishes a clean Ant Design Pro-aligned service layer architecture with domain partitioning, unified error interception, and pagination adaptation.

## Goals / Non-Goals

**Goals:**
- Partition API services by domain (`services/auth`, `services/user`, `services/order`, `services/system`) while maintaining 100% backward compatibility for existing flat imports.
- Enhance the core HTTP client (`gocliRequest.ts`) to support interceptors, `skipErrorHandler`, and a pluggable `errorHandler` callback.
- Implement `requestErrorConfig.ts` in `admin` and `portal` to automatically route HTTP and business errors to Ant Design `message` and `notification` according to severity.
- Provide a `toProTableRequest` adapter to eliminate pagination mapping boilerplate across all ProTable instances.
- Establish `apps/admin/src/services/` as a clean facade and refactor representative CRUD pages to demonstrate zero-boilerplate implementation.

**Non-Goals:**
- Replace browser-native `fetch` with Axios (keeping zero-dependency bundle efficiency).
- Modify the upstream `goctl` code generator binary.
- Alter backend HTTP/gRPC contracts or error codes.

## Decisions

### Decision 1: Domain Service Architecture with Zero-Generator Overwrite Risk
- **Approach**: Maintain `gateway.ts` as the raw generated artifact from `goctl api ts`, and create structured domain services under `frontend/packages/api/src/services/`:
  - `auth.ts`: Authentication, token refresh, and user profile
  - `user.ts`: Member user queries and updates
  - `order.ts`: Order queries, creation, payment, cancellation
  - `system/`: System management services (`users.ts`, `roles.ts`, `menus.ts`, `apis.ts`, `dicts.ts`, `logs.ts`)
- **Rationale**: Keeps automatic code generation (`just gen-ts`) fully functional without overwriting hand-crafted service groupings, while allowing pages to import domain-scoped services (e.g. `import { userSystemApi } from "@zero/api"` or `import { userService } from "@/services"`).
- **Alternative considered**: Modifying `goctl` templates to output split files directly. Rejected because it complicates toolchain upgrades and mise version locking.

### Decision 2: Framework-Agnostic Core with UI-Injected Error Handling
- **Approach**: In `@zero/api/gocliRequest.ts`, expose:
  - `addRequestInterceptor(interceptor)`
  - `addResponseInterceptor(interceptor)`
  - `setErrorHandler(handler)`
  - Request option `skipErrorHandler?: boolean`
- In `apps/admin/src/requestErrorConfig.ts` and `apps/portal/src/requestErrorConfig.ts`:
  - Hook into Ant Design's `App.useApp()` or top-level notification dispatcher.
  - Automatically display error messages for 400s and business errors, warnings for 403s, and critical notifications for 500s/network failures.
- **Rationale**: Keeps `@zero/api` pure and framework-agnostic (can be used in Node, React, or Vue) while empowering the applications to provide rich, contextual Ant Design UI feedback.

### Decision 3: ProTable Request Adapter (`toProTableRequest`)
- **Approach**: Provide a lightweight higher-order function:
  ```ts
  export function toProTableRequest<TParams, TItem>(
    apiFn: (params: any) => Promise<{ list?: TItem[]; total?: number }>
  ) {
    return async (params: Record<string, any>, sort: any, filter: any) => {
      const { current, pageSize, ...rest } = params;
      const res = await apiFn({
        page: current || 1,
        pageSize: pageSize || 10,
        ...rest,
        sort,
        filter,
      });
      return {
        data: res.list || [],
        total: res.total || 0,
        success: true,
      };
    };
  }
  ```
- **Rationale**: Eliminates repetitive mapping code in all ProTable pages, converting 10-line request handlers into a single clean line.

## Risks / Trade-offs

- **[Risk] Duplicate Error Alerts**: If a page still includes `catch (err) { message.error(...) }`, both the global handler and the local handler might fire.
  - **Mitigation**: Mark `(error as any).handled = true` when handled by the global error handler, and support `skipErrorHandler: true` for operations that need custom error processing.
- **[Risk] Multiple App Instances**: In Vite HMR, multiple interceptors might be registered.
  - **Mitigation**: Implement idempotency in `setErrorHandler` (replacing rather than accumulating the handler).
