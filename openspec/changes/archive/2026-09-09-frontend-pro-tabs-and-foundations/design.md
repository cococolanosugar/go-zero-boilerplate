## Context

See proposal.md for motivation and high-level requirements. The application currently defaults to redirecting all unmatched routes to `/dashboard`, lacks a unified 500 fault view, uses unstyled browser scrollbars, and does not support tabbed browsing across concurrent views.

## Goals / Non-Goals

**Goals:**
- Provide enterprise `404.tsx` (Not Found) and `500.tsx` (Internal Error) views under `src/pages/Exception/`.
- Rework `config/routes.ts` so unmatched paths render the 404 view, and `/500` is accessible for system fault redirects.
- Provide `src/global.css` with universal 6px adaptive scrollbars, imported into `src/main.tsx`.
- Establish `src/constants/index.ts` consolidating client storage keys, default pagination limits, and tab presets.
- Build `src/components/MultiTabs/index.tsx` integrated into `src/layouts/BasicLayout.tsx` with a `tabsLayout` boolean flag in `src/config/defaultSettings.ts`.

**Non-Goals:**
- Deep DOM-detaching KeepAlive hacks; tabs operate as route-synced bookmarks with clean lifecycle handling to avoid React 18 memory retention and state desynchronization.

## Decisions

### 1. Multi-Tabs Route Synchronization
- **Decision**: Keep multi-tabs synchronized with `location.pathname`. When navigating to an authorized path, if it is not in the active tabs set, append it with its localized title and icon.
- **Anchor Tab**: The `/dashboard` route is permanently pinned as an uncloseable anchor tab.
- **Context Actions**: Provide a dropdown for "Close Current", "Close Others", "Close All to Dashboard", and "Refresh Route".

### 2. Exception Pages Standard Alignment
- **Decision**: Author `404.tsx` and `500.tsx` using `@ant-design/pro-components` `Result` component.
- **Rationale**: Reuses design tokens, dark theme algorithms, and localization strings already present in the workspace.

### 3. Universal Slim Scrollbars
- **Decision**: Use modern CSS `::-webkit-scrollbar` with `6px` width, `3px` radius, and semi-transparent thumb (`rgba(0, 0, 0, 0.2)` on light theme, `rgba(255, 255, 255, 0.25)` on dark theme).
- **Rationale**: Instantly elevates visual sophistication on Windows and Linux without incurring JavaScript scroll-listener overhead.

## Risks / Trade-offs

- **[Tabs Overflow on Small Screens]** → MultiTabs uses Ant Design `<Tabs>` with built-in scroll arrows and overflow dropdown to guarantee usability on compact screens.
- **[404 on Protected vs Public Routes]** → The 404 page is registered inside the main layout so authenticated users retain their navigation header, and also available as a standalone route.
