/// <reference types="vite/client" />

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.jpeg" {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_APP_ENV: string;
  readonly VITE_USE_MOCK?: string;
  readonly PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const REACT_APP_ENV: "test" | "dev" | "pre" | "mock" | false;
