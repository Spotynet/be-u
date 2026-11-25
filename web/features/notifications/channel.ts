/** Cross-tab sync for notification unread/read mutations. */

export const NOTIFICATIONS_CHANNEL = "nabbi-notifications";
export const NOTIFICATIONS_STORAGE_KEY = "nabbi:notifications:sync-v1";

export type NotificationsBroadcast =
  | {kind: "unread"; unreadCount: number; at: number}
  | {kind: "read"; id: number; unreadCount: number; at: number}
  | {kind: "unread-one"; id: number; unreadCount: number; at: number}
  | {kind: "read-all"; unreadCount: number; at: number}
  | {kind: "remove"; id: number; unreadCount: number; at: number}
  | {kind: "refresh"; at: number};

export function postNotificationsBroadcast(msg: NotificationsBroadcast): void {
  if (typeof window === "undefined") return;
  try {
    const bc = new BroadcastChannel(NOTIFICATIONS_CHANNEL);
    bc.postMessage(msg);
    bc.close();
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify({...msg, _nonce: Math.random()}),
    );
  } catch {
    /* ignore */
  }
}

export function subscribeNotificationsBroadcast(
  onMsg: (msg: NotificationsBroadcast) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(NOTIFICATIONS_CHANNEL);
    bc.onmessage = (e) => {
      if (e.data && typeof e.data === "object" && "kind" in e.data) {
        onMsg(e.data as NotificationsBroadcast);
      }
    };
  } catch {
    bc = null;
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key !== NOTIFICATIONS_STORAGE_KEY || !e.newValue) return;
    try {
      const parsed = JSON.parse(e.newValue) as NotificationsBroadcast;
      if (parsed && typeof parsed === "object" && "kind" in parsed) onMsg(parsed);
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("storage", onStorage);
    try {
      bc?.close();
    } catch {
      /* ignore */
    }
  };
}
