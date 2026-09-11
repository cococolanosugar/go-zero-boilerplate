## Context

See `proposal.md` for background and motivation. The frontend architecture consists of a monorepo with `apps/admin`, `apps/portal`, and shared packages (`@zero/api`, `@zero/shared`). This design outlines the technical approach to implement timeout resilience, 401 redirect preservation, shared monorepo utilities, multi-tab UX enhancements, dynamic route search, offline awareness, and asset decoupling.

## Goals / Non-Goals

**Goals:**
- Implement transparent HTTP request timeout handling with signal chaining.
- Preserve intended deep-link paths on 401 unauthenticated redirects.
- Eliminate duplicated storage and file download logic by lifting them to `@zero/shared` while preserving existing import paths via re-exports.
- Enhance admin `MultiTabs` with session persistence across F5 refreshes and a "关闭右侧" action.
- Replace hardcoded `CommandPalette` items with dynamic route tree walking.
- Provide real-time offline detection and theme-aware charting.

**Non-Goals:**
- Modifying backend Go services, RPC contracts, or database schemas.
- Modifying authentication state machines or JWT verification logic.
- Rewriting routing structure or replacing Ant Design / Ant Design Pro Components.

## Decisions

### 1. Request Timeout with Signal Chaining
In `packages/api/src/gocliRequest.ts`, requests currently only accept an optional `options.signal`.
**Decision**: Introduce `options.timeout?: number` (defaulting to 30,000ms). When a timeout is set, an internal `AbortController` is managed with `setTimeout`. If the caller provides their own `options.signal`, listen to the caller's abort event to trigger the internal controller as well. If the timeout triggers first, abort with reason and throw an `ApiError(-3, '请求超时，请检查网络')`. Clear the timer in the `finally` block to avoid memory leaks.
*Alternative considered*: Using `AbortSignal.timeout(ms)` directly. While supported in modern browsers, chaining an existing caller signal requires `AbortSignal.any()` which has spotty support in older browsers. Managing an internal `AbortController` guarantees 100% compatibility.

### 2. 401 Redirect Preservation
In `apps/admin/src/pages/system/Login/index.tsx` (and `LoginPage.tsx`), the redirect destination is currently read only from `location.state?.from?.pathname`.
**Decision**: Check both `location.state?.from?.pathname` and `new URLSearchParams(location.search).get('from')` (decoding if necessary), prioritizing explicit state then query params, with fallback to `/dashboard`. When unauthorized responses occur in `gocliRequest.ts`, include `encodeURIComponent(window.location.pathname + window.location.search)` in `?from=...`.

### 3. Monorepo DRY Utilities in `@zero/shared`
`apps/admin/src/utils/storage.ts` and `apps/portal/src/utils/storage.ts` are identical (101 lines each), as are `download.ts` (77 lines) and `useAbortController.ts` (33 lines).
**Decision**: Lift the canonical implementations into `packages/shared/src/utils/storage.ts`, `packages/shared/src/utils/download.ts`, and `packages/shared/src/hooks/useAbortController.ts`. Export them from `packages/shared/src/index.ts`. In `apps/admin` and `apps/portal`, simplify local files to re-export from `@zero/shared`, ensuring zero breakage for existing imports across the entire codebase.

### 4. MultiTabs Session Persistence & "Close Right"
In `apps/admin/src/components/MultiTabs/index.tsx`, tab state currently resets to initial defaults on F5 reload.
**Decision**: Use `sessionStore` (key: `ZERO_ADMIN_OPEN_TABS`) to persist open tab items and active tab key. On initialization, hydrate tabs from session store if present and valid. For the dropdown menu, add a "关闭右侧标签页" option: find the index of the clicked/active tab, and slice tabs to only keep tabs with `index <= targetIndex` (plus pinning rules if applicable).

### 5. Dynamic CommandPalette Route Indexing
In `apps/admin/src/components/CommandPalette/index.tsx`, searchable commands are hardcoded in a static list.
**Decision**: Traverse `routes.ts` recursively. Extract routes having a `path` and `name`/`label`. For localized titles, use `intl.formatMessage` matching `menu.<name>`. Filter items against current user permissions via `access`. When selected, execute `navigate(route.path)`.

### 6. Offline Banner and Local Assets
In `Root.tsx` of both apps, add `online`/`offline` window event listeners managing an `isOffline` state. When offline, render a top-level Ant Design `<Alert banner type="warning" message="..." showIcon />`.
Replace the external CDN logo in `LoginPage.tsx` with local `/favicon.svg`.
In `apps/portal/src/pages/Home/index.tsx`, pass `theme: isDark ? 'classicDark' : 'classic'` into `@ant-design/charts` `<Area />`.

## Risks / Trade-offs

- **[Risk] Multiple simultaneous timeouts / memory leaks in long-running apps**
  → *Mitigation*: Ensure `clearTimeout(timer)` is strictly called in `finally` blocks in `gocliRequest.ts`.
- **[Risk] Session storage containing stale tabs after permission downgrade or route deletion**
  → *Mitigation*: During `MultiTabs` initialization from `sessionStorage`, validate that persisted paths match defined routes and user permissions, falling back to `/dashboard` if empty or invalid.
- **[Risk] Breaking existing test suites that mock local storage or download**
  → *Mitigation*: Re-exporting from local files in `apps/admin/src/utils/` ensures existing import paths and unit tests continue to resolve seamlessly.
