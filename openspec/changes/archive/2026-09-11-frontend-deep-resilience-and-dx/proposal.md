## Why

While core UI components and build configurations are established, deeper architectural resilience and DX enhancements are needed:
1. Network requests lack timeout safeguards, risking connection lockup if the network hangs.
2. 401 redirection drops query parameters, stranding users on `/dashboard` instead of returning to their original route.
3. Storage and file download utilities are duplicated across `apps/admin` and `apps/portal`.
4. Multi-tab states reset on page refresh, and lack "close right" actions.
5. The global command palette relies on hardcoded route entries rather than dynamic routing discovery.
6. Offline disconnections lack graceful user notification, and the login logo relies on external CDN assets.

Implementing these enhancements now solidifies production robustness and monorepo code efficiency without backend changes.

## What Changes

- **Request Timeout Protection**: Add configurable `timeout` support (default 30s) to `gocliRequest.ts` with signal chaining, throwing `ApiError(-3, '请求超时，请检查网络')` on expiration.
- **Login Redirect Route Restoration**: Update `LoginPage.tsx` to read `?from=...` query parameters in addition to location state, returning users to their intended route after authentication.
- **Shared Storage and Download Utilities**: Lift `SafeStorage` (with TTL and namespace) and `download` utilities (`downloadBlob`, `downloadByUrl`, `extractFilenameFromDisposition`) into `@zero/shared`, removing duplication across `admin` and `portal`.
- **MultiTabs Session Persistence & Close Right**: Persist open tabs to session storage across page reloads and add "关闭右侧标签页" (Close to the Right) action.
- **Dynamic CommandPalette Route Indexing**: Dynamically discover accessible routes from `routes.ts` with i18n titles and icons, removing hardcoded navigation lists.
- **Offline Network Guard**: Display an Ant Design Alert banner when `navigator.onLine` drops, automatically clearing upon reconnection.
- **Self-Hosted Assets & Chart Theme Adaptation**: Replace external login CDN logo with local `/favicon.svg`, and dynamically adapt `@ant-design/charts` to dark mode in portal.

## Capabilities

### New Capabilities
- `frontend-deep-resilience-and-dx`: Comprehensive frontend improvements spanning network timeout protection, login redirection preservation, shared storage and download abstractions, multi-tab persistence and actions, dynamic command palette indexing, offline status alerts, and theme adaptation.

### Modified Capabilities
<!-- None -->

## Impact

- **Frontend Apps**: `frontend/apps/admin`, `frontend/apps/portal`.
- **Frontend Packages**: `frontend/packages/api`, `frontend/packages/shared`.
- **Backend Services**: None (pure client-side and monorepo shared package enhancements).
