## Why

Following the comprehensive architectural comparison with Ant Design Pro, four key high-impact frontend optimization opportunities were identified across `admin` and `portal`:
1. Production bundle chunks currently exceed 1.47MB with circular module warnings, slowing initial page load (FCP) and invalidating vendor caches upon minor edits.
2. Form dialogs in management pages rely on manual `Modal + Form` state management, introducing repetitive boilerplate and error-prone lifecycle handling.
3. Rapid page transitions and fast pagination trigger concurrent requests without automatic cancellation (`AbortController`), risking network race conditions and stale state overwrites.
4. Multi-tab user sessions are isolated: logging out or updating preferences (theme/locale) in one browser tab fails to immediately synchronize across other open tabs.

Both `admin` and `portal` frontends require unified alignment to resolve these bottlenecks with zero backend modifications.

## What Changes

- **Vite Production Chunk Splitting (`manualChunks`)**:
  - Configure granular `rollupOptions.output.manualChunks` in both `apps/admin/vite.config.ts` and `apps/portal/vite.config.ts`.
  - Separate React runtime (`vendor-react`), Ant Design primitives (`vendor-antd-core`), component library (`vendor-antd`), and ProComponents (`vendor-pro`), eliminating monolithic 1MB+ bundles and resolving circular import warnings.
- **Modern Modal & Drawer Form Archetype (`ModalForm` / `DrawerForm`)**:
  - Modernize CRUD modals in `apps/admin` (e.g., user/role management) using ProComponents `ModalForm` with declarative trigger buttons and automatic lifecycle/reset handling.
- **Request Resilience & Anti-Race Cancellation (`AbortController`)**:
  - Enhance `@zero/api` (`gocliRequest.ts`) to accept `signal?: AbortSignal` and support scoped request cancellation.
  - Introduce router-level and table-level abort controllers in both `admin` and `portal` to automatically abort in-flight requests when users navigate away or re-filter data.
- **Multi-Tab Session & Preferences Synchronization**:
  - Implement cross-tab state broadcast in `@zero/shared` using `storage` events / `BroadcastChannel`.
  - Synchronize authentication revocation (instant cross-tab logout) and layout preferences (dark mode, theme color, locale) across all active tabs in both `admin` and `portal`.
- **Zero Backend Impact**:
  - Strictly confined to `frontend/apps/admin`, `frontend/apps/portal`, `frontend/packages/api`, and `frontend/packages/shared`. No Go code, microservice proto, or gateway YAML will be modified.

## Capabilities

### New Capabilities
- `frontend-optimization-and-alignment`: Covers production chunk splitting, modal form governance, request abort resilience, and multi-tab session synchronization across both `admin` and `portal`.

### Modified Capabilities
*(None - existing spec-level contracts remain valid and additive)*

## Impact

- `frontend/apps/admin/vite.config.ts`: Chunk splitting and build optimization.
- `frontend/apps/portal/vite.config.ts`: Chunk splitting and build optimization aligned with admin.
- `frontend/packages/api/src/gocliRequest.ts`: AbortSignal support and request cancellation.
- `frontend/packages/shared/`: Cross-tab broadcast utilities.
- `frontend/apps/admin/src/`: ModalForm modernization, multi-tab auth/theme listeners, router abort integration.
- `frontend/apps/portal/src/`: Multi-tab auth/theme listeners, router abort integration.
- Automated tests in both `admin` and `portal` validating chunking, abort behavior, and session sync.
