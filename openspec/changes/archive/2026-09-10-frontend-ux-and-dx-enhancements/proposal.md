## Why

Following recent architecture alignments and ProComponents integration, the frontend applications (`admin` and `portal`) require targeted UX and DX refinements to achieve enterprise-grade polish:
1. First Contentful Paint (FCP) experiences a blank white flash prior to React bundle initialization and hydration.
2. ProTable column visibility and width preferences reset upon page refresh or navigation.
3. User privacy and data security require standardized masking for sensitive identifiers (phone numbers, email addresses, ID cards).
4. Cross-app utility tooling lacks shared primitives for clipboard copy, debouncing, throttling, and CSV export.
5. Multi-step and complex forms lack guardrails against accidental navigation loss when inputs are dirty.
6. The public portal lacks structured SEO and OpenGraph metadata for search indexing and social sharing.

Addressing these issues now ensures a responsive, production-ready enterprise frontend experience without modifying backend services.

## What Changes

- **HTML Inline Shell Skeleton**: Embed lightweight inline CSS and skeleton markup inside `<div id="root">` in both `apps/admin/index.html` and `apps/portal/index.html` to provide instant visual feedback while scripts load.
- **ProTable Column State Persistence**: Configure `columnsState` (`persistenceKey` and `persistenceType: 'localStorage'`) across admin ProTables (`Users`, `Roles`, `Orders`, `System/Logs`, `System/Apis`, `System/Dicts`).
- **Data Masking Utilities & Table Integration**: Provide `maskPhone`, `maskEmail`, and `maskIdCard` in `@zero/shared`, and apply them to `Users` and `Orders` tables.
- **Shared Utilities Expansion**: Implement `copyToClipboard`, `debounce`, `throttle`, and promote `exportCsv` into `@zero/shared` with full unit test coverage.
- **Unsaved Form Navigation Guard**: Provide a `useUnsavedWarning` hook that guards against both in-app client-side navigation (`useBlocker` / prompt) and browser window closure (`beforeunload`), integrated with `StepForm`.
- **Portal SEO & OpenGraph Metadata**: Add comprehensive `<meta>` tags (description, keywords, OpenGraph `og:*`, Twitter card) to `apps/portal/index.html`.

## Capabilities

### New Capabilities
- `frontend-ux-and-dx-enhancements`: UX and developer experience enhancements including inline shell skeletons, ProTable column persistence, sensitive data masking, shared utility functions, unsaved form navigation protection, and portal SEO metadata.

### Modified Capabilities
<!-- None -->

## Impact

- **Frontend Apps**: `frontend/apps/admin`, `frontend/apps/portal`.
- **Frontend Packages**: `frontend/packages/shared`.
- **Dependencies**: No external runtime dependencies added; uses standard Web APIs and Ant Design / ProComponents features.
- **Backend Services**: No changes to backend Go services, RPC contracts, or SQL schemas.
