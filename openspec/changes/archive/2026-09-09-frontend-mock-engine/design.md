## Context

See `proposal.md - Why`. Currently, `@zero/admin` and `@zero/portal` forward all `/api` requests to a live Go backend via `proxy.ts`.

## Goals / Non-Goals

**Goals:**
- Provide a zero-dependency Vite development plugin (`mockPlugin`) that parses and serves `mock/*.mock.ts` definitions when `VITE_USE_MOCK=true`.
- Implement Ant Design Pro-compatible mock datasets in `frontend/apps/admin/mock/` covering:
  - Authentication & Profile: `/api/v1/user/login`, `/api/v1/system/auth/login`, `/api/v1/system/auth/profile`, `/api/v1/user/info`
  - System Management: `/api/v1/system/users`, `/api/v1/system/roles`, `/api/v1/system/menus`, `/api/v1/system/dicts`, `/api/v1/system/logs`
  - Dashboard: `/api/v1/dashboard/overview`
  - Orders: `/api/v1/orders/list`, `/api/v1/orders/detail/:id`
- Support progressive passthrough to `proxy.ts` for any unmatched API route.
- Add `.env.mock` and `dev:mock` commands across `admin` and `portal`.

**Non-Goals:**
- Service Worker-based production mocking (e.g. MSW in production). Mocking is strictly restricted to development sessions.
- Modifying Go microservice RPC or Gateway logic.

## Decisions

### Decision 1: Custom Connect Middleware vs. External Heavy Packages
- **Design**: Implement a lightweight Vite plugin using Vite's `configureServer(server)` hook and Node's connect middleware.
- **Rationale**: External packages (like `vite-plugin-mock`) often carry outdated peer dependencies incompatible with Vite 6.x or require redundant configuration files. A dedicated internal middleware (~80 lines) is zero-dependency, ultra-fast, and gives us full control over request inspection, body parsing, latency simulation, and colorized terminal logs (`\x1b[35m[Mock 响应]\x1b[0m`).

### Decision 2: Ant Design Pro `"METHOD /path"` Routing Model
- **Design**:
  ```ts
  export default {
    'POST /api/v1/user/login': (req, res) => { ... },
    'GET /api/v1/system/auth/profile': { code: 200, msg: 'SUCCESS', data: { ... } },
  };
  ```
- **Rationale**: Familiar to all developers with Ant Design Pro experience. Allows both static JSON shorthand and dynamic functions that inspect query params (`url.searchParams`) or parsed JSON request bodies.

### Decision 3: Progressive Proxy Passthrough
- **Design**: If a request does not match any entry in the aggregated mock map, the middleware simply calls `next()`.
- **Rationale**: Enables hybrid development—developers can mock a single new feature while the rest of the app connects to the real Go backend.

## Risks / Trade-offs

- **[Risk] Mock Data Schema Drift**: Mock data might diverge from `@zero/api` Go types.
  - **Mitigation**: Mock modules import response types directly from `@zero/api` to enforce compile-time type safety.
- **[Risk] Asynchronous Body Parsing**: POST/PUT requests stream chunks in Node.
  - **Mitigation**: The middleware collects request chunks into `req.body` before calling handlers.
