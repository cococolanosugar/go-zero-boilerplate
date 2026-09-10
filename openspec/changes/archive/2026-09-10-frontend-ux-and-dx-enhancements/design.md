## Context

The frontend applications (`apps/admin` and `apps/portal`) are built on Vite, React 18, Ant Design 6, and `@zero/shared`. Previous milestones completed the Pro architecture alignment, Vite 3-tier vendor chunking, and session synchronization. To further elevate the user and developer experience, targeted improvements are needed across pre-render skeletons, table state persistence, data sanitization, utilities, form guards, and SEO.

## Goals / Non-Goals

**Goals:**
- Eliminate pre-React white screen flash with zero-dependency inline HTML/CSS skeletons in both `admin` and `portal`.
- Provide localStorage-backed ProTable column layout persistence across all primary management tables (`Users`, `Roles`, `Orders`, `Logs`, `Apis`, `Dicts`).
- Introduce standardized sensitive data masking helpers (`maskPhone`, `maskEmail`, `maskIdCard`) in `@zero/shared` with unit test coverage and ProTable renderers.
- Expand `@zero/shared` with native browser-friendly utilities (`copyToClipboard`, `debounce`, `throttle`, `exportCsv`).
- Implement an unsaved form navigation interceptor (`useUnsavedWarning`) to guard against data loss on `beforeunload` and client route transitions.
- Enhance `apps/portal/index.html` with production-grade SEO and OpenGraph metadata.

**Non-Goals:**
- No changes to Go backend services, gRPC protos, or MySQL schemas.
- No heavy third-party utility dependencies (e.g. lodash, clipboard-polyfill); keep utilities native and tree-shakeable.
- No dynamic server-side rendering (SSR) for portal; metadata remains static in `index.html`.

## Decisions

### 1. Inline Shell Skeletons in Root Container
- **Choice**: Embed an inline `<style>` and minimal HTML layout inside `<div id="root">` for both `apps/admin/index.html` and `apps/portal/index.html`.
- **Rationale**: When React mounts via `createRoot(document.getElementById('root')!).render(...)`, it automatically clears the existing DOM children of `#root`. This delivers immediate First Contentful Paint (FCP) styled as an Ant Design app shell (header, navigation, content placeholder with pulsing animation) with 0kb external bundle overhead.
- **Alternatives Considered**: Ant Design `<Skeleton>` component (only renders after React loads, missing the pre-hydration window); external CSS file (adds network latency to FCP).

### 2. ProTable `columnsState` Persistence
- **Choice**: Configure `columnsState={{ persistenceKey: '<unique-key>', persistenceType: 'localStorage' }}` on all administrative ProTables:
  - `pro-table-columns-users`
  - `pro-table-columns-roles`
  - `pro-table-columns-orders`
  - `pro-table-columns-system-logs`
  - `pro-table-columns-system-apis`
  - `pro-table-columns-system-dicts`
- **Rationale**: ProTable natively supports column visibility, width, and order persistence via `persistenceKey`. Using `localStorage` preserves the layout across page reloads and tab closures.

### 3. Data Masking Primitives in `@zero/shared`
- **Choice**: Implement `maskPhone`, `maskEmail`, and `maskIdCard` as pure functions in `packages/shared/src/utils/masking.ts`.
- **Implementation**:
  - `maskPhone(val)`: Transforms `13812345678` into `138****5678`. Supports custom unmasked head/tail counts and custom mask characters.
  - `maskEmail(val)`: Transforms `alice@example.com` into `a***e@example.com` or `a***@example.com` while strictly maintaining domain visibility.
  - `maskIdCard(val)`: Transforms `110101199003072345` into `110101********2345`.
  - All utilities handle empty, undefined, or malformed values gracefully.

### 4. Shared Utilities Toolchain Expansion
- **Choice**: Consolidate common utility functions into `packages/shared/src/utils/`:
  - `copyToClipboard`: Uses `navigator.clipboard.writeText` when available; falls back to an invisible textarea and `document.execCommand('copy')` in insecure HTTP contexts or older browsers.
  - `debounce` / `throttle`: Lightweight TypeScript implementations with `cancel` handle.
  - `exportCsv`: Promote existing CSV generator from `admin/src/utils/export.ts` into `@zero/shared` with UTF-8 BOM prefix, comma/quote escaping, and automated file download trigger.

### 5. Unsaved Form Navigation Guard
- **Choice**: Create `useUnsavedWarning(isDirty, message?)` in `apps/admin/src/hooks/useUnsavedWarning.ts`.
- **Implementation**:
  - Registers a `window.addEventListener('beforeunload', handler)` when `isDirty` is true to protect against browser close/reload.
  - Provides a confirmation callback and integrates with the multi-step form (`StepForm`).

### 6. Portal SEO & OpenGraph Tags
- **Choice**: Enrich `apps/portal/index.html` with:
  - `<meta name="description">`, `<meta name="keywords">`, `<meta name="author">`
  - `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:type">`, `<meta property="og:image">`
  - `<meta name="twitter:card">`, `<meta name="twitter:title">`, `<meta name="twitter:description">`

## Risks / Trade-offs

- **[Risk] ProTable column state conflicts after schema changes** → ProTable provides a "Reset" (重置) action in the column setting dropdown; users can reset layout if table columns change in future releases.
- **[Risk] `beforeunload` custom messages ignored by modern browsers** → Standard browser security policy ignores custom strings in `event.returnValue`; setting `event.preventDefault()` and `event.returnValue = ''` triggers the standard browser prompt reliably.
- **[Risk] Inline skeleton CSS conflicts with Ant Design styles** → Skeleton styles are strictly scoped under `#root > .app-skeleton` and get removed completely once React hydrates and renders `#root`.
