/**
 * 带命名空间与过期时间 (TTL) 的本地持久化存储包装器
 */

interface StorageRecord<T> {
  value: T;
  expireTime: number | null; // 绝对毫秒时间戳，null 为永不过期
}

export class SafeStorage {
  private prefix: string;
  private storage: Storage;

  constructor(prefix = "ZERO_PORTAL_", storage: Storage = window.localStorage) {
    this.prefix = prefix;
    this.storage = storage;
  }

  private formatKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * 存储数据项
   * @param key 键名
   * @param value 任意可序列化对象
   * @param ttlMs 有效期（毫秒），不传或 <= 0 则永久有效
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    if (typeof window === "undefined") return;

    const fullKey = this.formatKey(key);
    const expireTime = ttlMs && ttlMs > 0 ? Date.now() + ttlMs : null;
    const record: StorageRecord<T> = {
      value,
      expireTime,
    };

    try {
      this.storage.setItem(fullKey, JSON.stringify(record));
    } catch (err) {
      console.error(`[SafeStorage] Failed to set item ${fullKey}:`, err);
    }
  }

  /**
   * 获取数据项，若已过期则自动清除并返回 defaultValue
   * @param key 键名
   * @param defaultValue 兜底默认值
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    if (typeof window === "undefined") return defaultValue;

    const fullKey = this.formatKey(key);
    const raw = this.storage.getItem(fullKey);
    if (!raw) return defaultValue;

    try {
      const record: StorageRecord<T> = JSON.parse(raw);
      if (record.expireTime && record.expireTime < Date.now()) {
        this.remove(key);
        return defaultValue;
      }
      return record.value;
    } catch {
      return defaultValue;
    }
  }

  /**
   * 移除指定项
   */
  remove(key: string): void {
    if (typeof window === "undefined") return;
    this.storage.removeItem(this.formatKey(key));
  }

  /**
   * 清除当前命名空间下的所有存储项
   */
  clear(): void {
    if (typeof window === "undefined") return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const k = this.storage.key(i);
      if (k && k.startsWith(this.prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => this.storage.removeItem(k));
  }
}

export const localStore = new SafeStorage("ZERO_PORTAL_");
export const sessionStore = new SafeStorage(
  "ZERO_PORTAL_",
  typeof window !== "undefined" ? window.sessionStorage : ({} as Storage)
);

export default localStore;