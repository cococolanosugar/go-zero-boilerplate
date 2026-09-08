## Why

Currently, developing frontend applications requires running the full Go microservice backend and middleware infrastructure (MySQL, Redis, Nacos, Gateway, User RPC, Order RPC). This slows down pure UI development and prototyping, prevents frontend engineers from working in parallel before backend RPC logic is finalized, and prevents running standalone demonstrations in offline environments without Docker or Go toolchains.

## What Changes

- Introduce an Ant Design Pro-aligned `mock/` module architecture (`auth.mock.ts`, `system.mock.ts`, `dashboard.mock.ts`, `orders.mock.ts`) supporting `"METHOD /path"` syntax with both static payloads and dynamic response handlers.
- Create a lightweight Vite Mock server plugin embedded in the development server middleware, with zero external heavy runtime dependencies.
- Support simulated network response latency (e.g. 150ms-300ms) to faithfully reproduce real-world loading indicators, table skeletons, and button spinning states.
- Implement progressive fallback passthrough: any `/api` endpoint not defined in `mock/` automatically passes through to the active Vite proxy target (`proxy.ts`).
- Add `.env.mock` environment configurations and corresponding `dev:mock` scripts in `package.json` and `justfile`.

## Capabilities

### New Capabilities
- `frontend-mock-engine`: In-development mock server and dataset system supporting Ant Design Pro-style mock modules, dynamic and static responses, simulated network latency, and fallback proxy passthrough.

### Modified Capabilities
<!-- None -->

## Impact

- `frontend/apps/admin/vite.config.ts` and `frontend/apps/portal/vite.config.ts`: Enhanced with the Vite Mock development middleware.
- New `mock/` directory and `.env.mock` in `frontend/apps/admin` and `frontend/apps/portal`.
- `frontend/package.json` and `justfile`: Added `run-admin-mock` and `run-portal-mock` commands.
- No impact on production builds or bundle output (`mock/` files are excluded from production artifacts).
