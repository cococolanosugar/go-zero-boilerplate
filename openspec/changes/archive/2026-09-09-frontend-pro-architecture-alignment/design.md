## Context

See proposal.md for motivation and context. The administration frontend currently lacks application-level browser utility modules, local static assets, global type declarations, an enterprise global footer, and an in-header quick search mechanism standard in Ant Design Pro.

## Goals / Non-Goals

**Goals:**
- Provide client-only browser utilities (`download.ts`, `storage.ts`) in `frontend/apps/admin/src/utils/`.
- Supply local branded SVG assets and `robots.txt` in `frontend/apps/admin/public/` to achieve 100% offline brand independence.
- Declare comprehensive global and environment types in `frontend/apps/admin/src/typings.d.ts`.
- Deliver a standardized `DefaultFooter` adhering to Ant Design Pro specs in `frontend/apps/admin/src/components/Footer/`.
- Deliver a keyboard-navigable (`Cmd+K` / `Ctrl+K`) `HeaderSearch` component in `frontend/apps/admin/src/components/HeaderSearch/` that dynamically matches authorized routes.

**Non-Goals:**
- Full state management refactor (P2 goal, keeping existing Context providers stable for now).
- External heavy search libraries (Algolia, Fuse.js); we utilize Ant Design's native `AutoComplete` and built-in fuzzy filtering.

## Decisions

### 1. Browser Utilities (`src/utils/`) vs Shared Package (`@zero/shared`)
- **Decision**: Keep pure isomorphic data/format functions in `@zero/shared`, and place DOM/Browser/Web Storage APIs strictly in `apps/admin/src/utils/`.
- **Rationale**: `@zero/shared` is shared across packages and must remain safe for any JavaScript runtime. Functions dealing with `window`, `document`, `Blob`, `URL.createObjectURL`, and `localStorage` are browser-exclusive.

### 2. HeaderSearch Keyboard Shortcut & Access Filtering
- **Decision**: Register global keyboard listener (`Cmd+K` / `Ctrl+K`) to toggle an inline/popover search box. Filter search candidates through the operator's dynamic permissions so unauthorized hidden routes are never suggested.
- **Rationale**: Matches Ant Design Pro / macOS Spotlight user experience while strictly honoring RBAC boundaries.

### 3. Native SVG Vector Branding Assets
- **Decision**: Author self-contained, theme-adaptive SVG vectors for `/favicon.svg` and `/logo.svg` in `public/` and reference them in `index.html` and `app.tsx`.
- **Rationale**: Guarantees crisp rendering on high-DPI retina screens and ensures 0 broken image requests when developing completely offline without internet connectivity.

## Risks / Trade-offs

- **[Memory Leak in File Downloads]** → `download.ts` creates `URL.createObjectURL(blob)`. Mitigation: Automatically invoke `URL.revokeObjectURL(url)` inside a `setTimeout(..., 1000)` cleanup lifecycle.
- **[Keyboard Shortcut Conflicts]** → Operators typing inside inputs or textareas might trigger `Cmd+K`. Mitigation: Guard shortcut handler to check `document.activeElement` when appropriate or allow standard command-palette behavior.
