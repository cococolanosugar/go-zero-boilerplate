import { SafeStorage } from "@zero/shared";

export { SafeStorage };
export type { StorageRecord } from "@zero/shared";

export const localStore = new SafeStorage("ZERO_ADMIN_");
export const sessionStore = new SafeStorage(
  "ZERO_ADMIN_",
  typeof window !== "undefined" ? window.sessionStorage : ({} as Storage)
);

export default localStore;
