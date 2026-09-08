## Why

Currently, both frontend applications (`@zero/admin` and `@zero/portal`) hardcode the local gateway address `http://127.0.0.1:8888` in their `vite.config.ts` proxy configuration. Frontend developers cannot easily switch to remote testing environments without running local Go microservice containers, cannot flexibly debug with colleague backends on the local network, and lack visible proxy request forwarding logs in the terminal during development.

## What Changes

- Introduce Ant Design Pro-style `config/proxy.ts` configuration files in both `admin` and `portal` apps, structuring proxies into `dev`, `test`, and `pre` environments.
- Support Vite environment modes (`dev:test`, `dev:pre`) via `.env.test` and `.env.pre` files.
- Enable dynamic CLI target overrides via `PROXY_TARGET` environment variable (e.g., `PROXY_TARGET=http://192.168.1.88:8888 pnpm dev`).
- Configure proxy request and error logging hooks (`proxy.on('proxyReq')`, `proxy.on('error')`) in `vite.config.ts` for real-time visibility into upstream routing.
- Add multi-environment dev scripts in `package.json` and Justfile tasks for streamlined developer workflows.

## Capabilities

### New Capabilities
- `frontend-multi-env-proxy`: Multi-environment proxy matrix supporting local dev, remote test, and pre-release targets with runtime logging and dynamic environment variable overrides.

### Modified Capabilities
<!-- None -->

## Impact

- `frontend/apps/admin/vite.config.ts` and `frontend/apps/portal/vite.config.ts`: Refactored to dynamically load proxy config based on mode and env.
- `frontend/apps/admin/package.json` and `frontend/apps/portal/package.json`: Added `dev:test` and `dev:pre` npm scripts.
- Added `proxy.ts`, `.env.test`, and `.env.pre` across frontend apps.
- No breaking changes to existing production builds or Docker Nginx reverse proxy configurations.
