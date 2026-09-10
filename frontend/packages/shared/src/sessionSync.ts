/**
 * 跨标签页状态与会话同步管理器 (Multi-Tab Session & Preference Synchronizer)
 * 基于 window.storage 事件实现同源多 Tab 毫秒级协同广播
 */

export const SYNC_STORAGE_KEY = "zero_session_sync_channel";

export type SessionSyncEventType =
  | "AUTH_LOGOUT"
  | "AUTH_LOGIN"
  | "THEME_CHANGE"
  | "LOCALE_CHANGE";

export interface SessionSyncPayload<T = any> {
  type: SessionSyncEventType;
  timestamp: number;
  data?: T;
}

export type SessionSyncListener<T = any> = (payload: SessionSyncPayload<T>) => void;

const listeners: Set<SessionSyncListener> = new Set();
let isListening = false;

function handleStorageEvent(e: StorageEvent) {
  if (e.key !== SYNC_STORAGE_KEY || !e.newValue) return;
  try {
    const payload: SessionSyncPayload = JSON.parse(e.newValue);
    listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error("[SessionSync] Listener execution error:", err);
      }
    });
  } catch (err) {
    console.error("[SessionSync] Parse payload failed:", err);
  }
}

/**
 * 启动全局跨 Tab 同步监听
 */
export function initSessionSync(): () => void {
  if (typeof window === "undefined") return () => {};

  if (!isListening) {
    window.addEventListener("storage", handleStorageEvent);
    isListening = true;
  }

  return () => {
    window.removeEventListener("storage", handleStorageEvent);
    isListening = false;
  };
}

/**
 * 订阅跨 Tab 广播事件
 */
export function addSessionSyncListener(listener: SessionSyncListener): () => void {
  listeners.add(listener);
  if (!isListening && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
    isListening = true;
  }
  return () => {
    listeners.delete(listener);
  };
}

/**
 * 向其他所有同源 Tab 广播状态更新
 */
export function broadcastSessionEvent<T = any>(
  type: SessionSyncEventType,
  data?: T
) {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;

  const payload: SessionSyncPayload<T> = {
    type,
    timestamp: Date.now(),
    data,
  };

  try {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("[SessionSync] Broadcast failed:", err);
  }
}
