## Context

`frontend/apps/portal` is the public-facing and developer portal in the go-zero monorepo. While `frontend/apps/admin` has received extensive architectural refinement (standardized `public/` assets, global responsive styling, typings, client-side storage with TTL, file download utilities, exception routing, and modular components), `portal` remained minimally scaffolded.

Both apps share `@zero/shared`, `@zero/api`, Vite, React 18, and Ant Design 6.x. To maintain architectural symmetry across the monorepo, `portal` needs to adopt the same directory conventions and foundational utilities, tailored to portal's domain (e.g. purple brand identity `#722ed1`, portal-scoped storage prefix `ZERO_PORTAL_`, and portal navigation paths `/home`).

See `proposal.md` for background motivation and `specs/portal-architecture-alignment/spec.md` for behavioral requirements.

## Goals / Non-Goals

**Goals:**
- **Branded Vector Independence**: Provide local `/favicon.svg`, `/logo.svg`, and `robots.txt` under `apps/portal/public/` using the portal's purple primary theme (`#722ed1`).
- **Visual Harmonization**: Implement `global.css` with 6px rounded scrollbars (with dark mode support) and font smoothing, imported at the portal's entrypoint (`main.tsx`).
- **Client Utilities & Typings**: Introduce `src/typings.d.ts`, `src/constants/index.ts`, and `src/utils/` (`SafeStorage`, `downloadBlob`) with the `ZERO_PORTAL_` storage namespace.
- **Routing Robustness**: Provide `Exception404` and `Exception500` under `src/pages/Exception/` and route wildcard unmapped URLs to 404 instead of blindly redirecting to `/home`.
- **Component Modularity**: Extract the inline footer from `app.tsx` into `src/components/Footer/index.tsx` and provide an export barrel `src/components/index.ts`.

**Non-Goals:**
- **MultiTabs**: Unlike the admin backend, the portal is a single-surface workbench and content portal; multi-tab management is deliberately omitted.
- **Business Logic Rewrites**: Home, Services, and Workbench pages are not modified except for any asset/constant reference cleanups.

## Decisions

### 1. Purple Palette for Portal Vector Assets (`#722ed1`)
- **Rationale**: Admin uses tech blue (`#1677ff`), while Portal uses geek purple (`#722ed1`). Generating distinct SVG assets ensures clear visual differentiation in browser tabs and layouts.
- **Alternative Considered**: Sharing SVG assets from `admin` or `@zero/shared`. Rejected because `public/` assets must be directly servable by Vite at runtime root (`/favicon.svg`), and brand identity differs between admin and portal.

### 2. Scoped Storage Wrapper (`ZERO_PORTAL_`)
- **Rationale**: Monorepo applications may run under the same origin/port during local debugging or staging proxies. Scoping portal storage with `ZERO_PORTAL_` avoids key collisions with admin (`ZERO_ADMIN_`).
- **Alternative Considered**: Plain `localStorage` usage. Rejected because plain `localStorage` lacks TTL expiration and type-safety, which caused stale configuration bugs previously.

### 3. Route Fallback to Dedicated 404 View
- **Rationale**: Catch-all redirecting `* -> /home` masks broken navigation links and frustrates users who mistype a URL. A standardized `Exception404` page informs users clearly and provides a button to return to `/home`.
- **Alternative Considered**: Keeping `Navigate to="/home" replace`. Rejected because silent redirection obscures routing bugs and degrades UX.

### 4. Modular Footer Component Extraction
- **Rationale**: `app.tsx` currently contains an inline `DefaultFooter` definition exceeding 25 lines. Extracting this to `src/components/Footer/index.tsx` mirrors `admin`'s structure and allows future expansion (e.g. dynamic footer links from settings).
- **Alternative Considered**: Leaving it inline in `app.tsx`. Rejected as it violates modular component conventions and clutters layout configuration.

## Risks / Trade-offs

- **[Risk] Path conflict in public asset serving** → *Mitigation*: Use standard Vite `/public` directory semantics, referencing `/favicon.svg` and `/logo.svg` directly from web root without relative `.` prefixes.
- **[Risk] Theme token mismatch in Exception pages** → *Mitigation*: Use Ant Design `Result` and `Button` components styled with token-aware flex containers, inheriting the portal's `ConfigProvider` purple primary color automatically.
- **[Risk] Global CSS affecting Ant Design component styles** → *Mitigation*: Limit `global.css` rules to `html, body, #root`, `::selection`, `::-webkit-scrollbar*`, and Firefox `scrollbar-*`, avoiding high-specificity tag overrides.

## Migration Plan

1. Create static assets in `frontend/apps/portal/public/`.
2. Add `global.css`, `typings.d.ts`, `constants/`, and `utils/`.
3. Add `pages/Exception/404.tsx` and `500.tsx`, updating `routes.ts`.
4. Refactor `components/Footer/index.tsx` and `app.tsx`.
5. Run `tsc --noEmit`, `just build-frontend`, and `just lint-antd` to verify zero regression.