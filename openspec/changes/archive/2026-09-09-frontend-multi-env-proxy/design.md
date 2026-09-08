## Context

See `proposal.md - Why`. Currently, both `apps/admin/vite.config.ts` and `apps/portal/vite.config.ts` configure a static `server.proxy` pointing to `http://127.0.0.1:8888`.

## Goals / Non-Goals

**Goals:**
- Provide typed `src/config/proxy.ts` in both `admin` and `portal` supporting `dev`, `test`, and `pre` environments.
- Use Vite's `loadEnv` to read `APP_ENV` and dynamically choose the proxy profile.
- Support `PROXY_TARGET` environment variable override for ad-hoc local IP or mock debugging.
- Add terminal request forwarding and error logging hooks.
- Expose `dev:test` and `dev:pre` scripts in `package.json` files and Justfile shortcuts.

**Non-Goals:**
- Modifying production Nginx configuration (`manifest/deploy/nginx/nginx.conf`), as production containers utilize Nginx reverse proxying rather than Vite dev servers.
- Changing backend Go API routing or ports.

## Decisions

### Decision 1: Ant Design Pro Pattern `config/proxy.ts`
- **Design**: Define `ProxyConfig` with `dev`, `test`, and `pre` profiles:
  ```ts
  import type { ProxyOptions } from "vite";

  export type EnvType = "dev" | "test" | "pre";

  export const proxyConfig: Record<EnvType, Record<string, ProxyOptions>> = {
    dev: {
      "/api": {
        target: "http://127.0.0.1:8888",
        changeOrigin: true,
        ws: true,
      },
    },
    test: {
      "/api": {
        target: "https://test-api.go-zero-boilerplate.dev",
        changeOrigin: true,
        secure: false,
      },
    },
    pre: {
      "/api": {
        target: "https://pre-api.go-zero-boilerplate.dev",
        changeOrigin: true,
        secure: true,
      },
    },
  };
  ```
- **Rationale**: Aligns with Ant Design Pro's standard `config/proxy.ts` architecture, keeping proxy rules clean, maintainable, and separated from the Vite bundler configuration.
- **Alternatives Considered**: Inlining all URLs directly into `vite.config.ts` (rejected due to code bloat and duplication).

### Decision 2: Target Precedence Hierarchy
- **Design**:
  1. If `PROXY_TARGET` environment variable is set (via CLI or shell), it overrides the active target unconditionally.
  2. Otherwise, read `APP_ENV` loaded by Vite from `.env.[mode]` (`dev`, `test`, `pre`).
  3. Default to `dev` (`http://127.0.0.1:8888`) if no environment is matched.
- **Rationale**: Gives developers ultimate flexibility: quick one-off CLI overrides without editing files, while maintaining team-standard environment scripts.

### Decision 3: Terminal Diagnostics via Proxy Lifecycle Hooks
- **Design**: Attach `configure: (proxy, options) => { proxy.on('proxyReq', ...); proxy.on('error', ...); }`.
- **Rationale**: Eliminates developer confusion over whether requests were forwarded, what path was called, and whether the upstream server refused the connection.

## Risks / Trade-offs

- **[Risk] SSL verification issues with internal test servers**: Test environments may use self-signed certificates.
  - **Mitigation**: Configure `secure: false` on the `test` proxy profile.
- **[Risk] WebSocket forwarding**: Microservices or real-time features may require WebSocket.
  - **Mitigation**: Enable `ws: true` on the `/api` proxy rule.
