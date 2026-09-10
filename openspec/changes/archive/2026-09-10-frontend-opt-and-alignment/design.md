## Context

The monorepo contains two React 18 applications: `apps/admin` (management console) and `apps/portal` (public/customer portal), powered by shared libraries `@zero/api` and `@zero/shared`. Both applications are built with Vite and Ant Design 6.

During recent performance and architectural inspections, four cross-cutting improvement areas were identified:
1. Neither application configured `output.manualChunks`, causing Vite to bundle runtime libraries and business code into monolithic 1.47MB chunks while emitting Rollup circular chunk warnings for ProForm layouts.
2. Form dialogs in management modules manually track `modalVisible`, `record`, and `form` state, accumulating repetitive boilerplate.
3. `@zero/api`'s `gocliRequest.ts` does not propagate `AbortSignal`, leaving fast pagination and route transitions vulnerable to network race conditions.
4. User sessions and appearance preferences across multiple browser tabs are isolated without real-time synchronization.

## Goals / Non-Goals

**Goals:**
- Implement aligned, granular Vite vendor chunking in both `apps/admin/vite.config.ts` and `apps/portal/vite.config.ts` (`vendor-react`, `vendor-antd-core`, `vendor-antd`, `vendor-pro`, `vendor-libs`).
- Eliminate Rollup circular layout warnings and keep chunk sizes well within optimal thresholds.
- Enhance `@zero/api` (`gocliRequest.ts`) to accept `signal?: AbortSignal`, gracefully suppressing `AbortError` from surfacing as user-facing toast errors.
- Provide an anti-race cancellation hook/helper in `@zero/shared` or `@zero/api` for page navigation and table queries.
- Build cross-tab broadcast synchronization in `@zero/shared` for instantaneous session revocation (logout) and preference propagation (theme, compact, locale) across both `admin` and `portal`.
- Modernize administrative CRUD dialogs in `admin` (e.g. Users/Roles) with ProComponents `ModalForm`.
- Maintain 100% test pass rate with new unit tests covering chunking, abort behavior, and session sync.

**Non-Goals:**
- Zero modifications to backend Go microservices, gateway routes, RPC logic, protobuf, or SQL schemas.
- No replacement or removal of Ant Design 6 / ProComponents design system.

## Decisions

### 1. Vite Chunk Partitioning Strategy
- **Decision**: Define explicit vendor chunks in `rollupOptions.output.manualChunks`:
  - `vendor-react`: `react`, `react-dom`, `react-router-dom`
  - `vendor-antd-core`: `@ant-design/icons`, `@ant-design/cssinjs`
  - `vendor-antd`: `antd`
  - `vendor-pro`: `@ant-design/pro-components`, `@ant-design/pro-form`, `@ant-design/pro-table`, `@ant-design/pro-layout`, `@ant-design/pro-card`, `@ant-design/pro-descriptions`
  - `vendor-libs`: other third-party dependencies.
- **Rationale**: Keeps the ProForm layout modules together in `vendor-pro`, directly resolving the circular dependency chunk warning. Libraries with low update frequencies are cached long-term by browsers.
- **Alternatives considered**: Automatic dynamic import splitting without manual configuration — rejected because it produces unpredictable chunks and fails to resolve ProComponents circular exports.

### 2. Native AbortSignal Integration in `@zero/api`
- **Decision**: Add `signal?: AbortSignal` to `RequestOptions` in `gocliRequest.ts`. In the `catch` handler, check `if (error.name === 'AbortError') return Promise.reject(error)` while preventing `globalErrorHandler` from triggering alarm notifications.
- **Rationale**: The browser `fetch` API natively understands `signal`. By passing through the signal, any caller (such as React Router or `useRequest`) can cancel pending network requests at zero external library cost.
- **Alternatives considered**: Introducing Axios for its CancelToken — rejected because `@zero/api` is already an ultra-lightweight fetch wrapper and adding Axios adds unnecessary weight.

### 3. Cross-Tab Session & State Synchronization via Storage Events
- **Decision**: Encapsulate a lightweight broadcast sync helper in `@zero/shared/src/sessionSync.ts` using `window.addEventListener('storage')` and timestamp-based payloads.
  - When `token` is cleared in one tab, sibling tabs detect key removal and immediately invoke `handleUnauthorized()` / redirect to `/login`.
  - When theme mode or locale changes, sibling tabs receive the payload and update local state accordingly.
- **Rationale**: The `storage` event is universally supported across all browsers without polyfills and automatically isolates events across browser tabs sharing the same origin.
- **Alternatives considered**: `BroadcastChannel` — rejected as the primary driver due to older Safari nuances, though `storage` event natively serves our multi-tab requirements.

### 4. ProComponents `ModalForm` / `DrawerForm` Archetype Adoption
- **Decision**: Refactor administrative management dialogs to use `ModalForm` with `trigger={<Button>...}</Button>`.
- **Rationale**: ProForm handles `autoFocusFirstInput`, `destroyOnClose`, form value population, and automatic close on successful `onFinish` return `true`.

## Risks / Trade-offs

- **[Risk] Intentionally aborted requests triggering error popups**
  $\rightarrow$ *Mitigation*: Specifically detect `err.name === 'AbortError'` or `DOMException` in `gocliRequest.ts` and set `handled = true` with silent exit.
- **[Risk] Multiple tabs fighting over storage events during rapid toggles**
  $\rightarrow$ *Mitigation*: Include a unique message timestamp/nonce in broadcast payloads so identical or stale updates are discarded.
