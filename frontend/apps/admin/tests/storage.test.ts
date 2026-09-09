import { describe, it, expect, beforeEach } from "vitest";
import { SafeStorage } from "../src/utils/storage";

describe("SafeStorage Utility", () => {
  let store: SafeStorage;

  beforeEach(() => {
    localStorage.clear();
    store = new SafeStorage("TEST_ADMIN_");
  });

  it("should set and get values correctly", () => {
    store.set("test_key", { name: "admin", count: 42 });
    const result = store.get<{ name: string; count: number }>("test_key");
    expect(result).toEqual({ name: "admin", count: 42 });
  });

  it("should return default value when key does not exist", () => {
    const result = store.get("non_existent", "default_val");
    expect(result).toBe("default_val");
  });

  it("should remove key successfully", () => {
    store.set("to_delete", "active");
    expect(store.get("to_delete")).toBe("active");
    store.remove("to_delete");
    expect(store.get("to_delete")).toBeUndefined();
  });

  it("should expire values when TTL is reached", async () => {
    // Set with 50ms TTL
    store.set("temp_token", "secret", 50);
    expect(store.get("temp_token")).toBe("secret");

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(store.get("temp_token")).toBeUndefined();
  });

  it("should isolate storage by prefix", () => {
    const anotherStore = new SafeStorage("OTHER_PREFIX_");
    store.set("shared_key", "from_admin");
    anotherStore.set("shared_key", "from_other");

    expect(store.get("shared_key")).toBe("from_admin");
    expect(anotherStore.get("shared_key")).toBe("from_other");
  });
});
