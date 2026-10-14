"use client";

import {PageContainer} from "@/components/layout/PageContainer";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {notificationApi, linkApi, errorUtils} from "@/lib/api";

const INK = "#12211A";
const MAIN = "#558367";

function deepLink(n: any): string | null {
  const data = n.data || n.payload || {};
  const type = String(n.type || n.notification_type || "").toLowerCase();
  if (data.reservation_id || data.reservationId) {
    return `/reservation/${data.reservation_id || data.reservationId}`;
  }
  if (data.group_session_id || data.groupSessionId) {
    return `/group-sessions/${data.group_session_id || data.groupSessionId}`;
  }
  if (data.link_id || data.linkId || type.includes("link") || type.includes("invite")) {
    return "/links";
  }
  if (data.post_id || data.postId) return `/post/${data.post_id || data.postId}`;
  if (data.public_profile_id || data.profile_id) {
    return `/profile/${data.public_profile_id || data.profile_id}`;
  }
  return null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications({
        ...(unreadOnly ? {status: "unread"} : {}),
      });
      setItems(res.data?.results || []);
    } catch (err) {
      setMessage(errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? {...n, status: "read", is_read: true, read: true} : n
        )
      );
    } catch {
      /* ignore */
    }
  };

  const markAll = async () => {
    try {
      await notificationApi.markAllAsRead();
      await load();
    } catch (err) {
      setMessage(errorUtils.getErrorMessage(err));
    }
  };

  const handleOpen = async (n: any) => {
    if (!n.is_read && n.status !== "read" && !n.read) {
      await markRead(n.id);
    }
    const href = deepLink(n);
    if (href) router.push(href);
  };

  const handleInvite = async (n: any, action: "accept" | "reject") => {
    const data = n.data || n.payload || {};
    const linkId = Number(data.link_id || data.linkId);
    if (!linkId) {
      router.push("/links");
      return;
    }
    setBusyId(n.id);
    try {
      if (action === "accept") await linkApi.acceptInvite(linkId);
      else await linkApi.rejectInvite(linkId);
      await markRead(n.id);
      setMessage(action === "accept" ? "Invitación aceptada." : "Invitación rechazada.");
      await load();
    } catch (err) {
      setMessage(errorUtils.getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const isInvite = (n: any) => {
    const type = String(n.type || n.notification_type || "").toLowerCase();
    const data = n.data || n.payload || {};
    return (
      type.includes("link") ||
      type.includes("invite") ||
      !!(data.link_id || data.linkId)
    );
  };

  const isUnread = (n: any) =>
    !(n.is_read || n.read || n.status === "read" || n.status === "READ");

  return (
    <PageContainer size="lg">
      <div className="nabbi-stack-row" style={{justifyContent: "space-between", alignItems: "flex-start"}}>
        <div style={{flex: "1 1 200px", minWidth: 0}}>
          <h1 className="nabbi-page-title">Notificaciones</h1>
          <p className="nabbi-page-sub" style={{marginBottom: 0}}>
            Inbox en la app (sin Web Push).
          </p>
        </div>
        <div className="nabbi-stack-row">
          <Link href="/notification-preferences" style={linkBtn}>
            Preferencias
          </Link>
          <button type="button" onClick={markAll} style={outlineBtn}>
            Marcar todas
          </button>
        </div>
      </div>

      <label style={{display: "flex", alignItems: "center", gap: 8, margin: "16px 0", fontSize: 14}}>
        <input
          type="checkbox"
          checked={unreadOnly}
          onChange={(e) => setUnreadOnly(e.target.checked)}
        />
        Solo no leídas
      </label>

      {message && (
        <div style={{marginBottom: 12, padding: 12, borderRadius: 12, background: "#ecfdf5", color: "#047857", fontSize: 14}}>
          {message}
        </div>
      )}

      {loading ? (
        <p style={{color: "#64748b"}}>Cargando…</p>
      ) : items.length === 0 ? (
        <p style={{color: "#64748b"}}>No hay notificaciones.</p>
      ) : (
        <ul style={{listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8}}>
          {items.map((n) => {
            const unread = isUnread(n);
            const invite = isInvite(n);
            return (
              <li
                key={n.id}
                style={{
                  background: unread ? "rgba(85,131,103,0.08)" : "white",
                  border: "1px solid rgba(18,33,26,0.08)",
                  borderRadius: 14,
                  padding: 14,
                }}>
                <button
                  type="button"
                  onClick={() => handleOpen(n)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    textAlign: "left",
                    width: "100%",
                    cursor: "pointer",
                  }}>
                  <div style={{fontWeight: 800, color: INK, fontSize: 15}}>
                    {n.title || n.subject || "Notificación"}
                  </div>
                  <div style={{fontSize: 13, color: "#64748b", marginTop: 4}}>
                    {n.message || n.body || n.content || ""}
                  </div>
                  {(n.created_at || n.timestamp) && (
                    <div style={{fontSize: 11, color: "#94a3b8", marginTop: 6}}>
                      {new Date(n.created_at || n.timestamp).toLocaleString("es-MX")}
                    </div>
                  )}
                </button>
                {invite && unread && (
                  <div style={{display: "flex", gap: 8, marginTop: 10}}>
                    <button
                      type="button"
                      disabled={busyId === n.id}
                      onClick={() => handleInvite(n, "accept")}
                      style={primaryBtn}>
                      Aceptar
                    </button>
                    <button
                      type="button"
                      disabled={busyId === n.id}
                      onClick={() => handleInvite(n, "reject")}
                      style={{...outlineBtn, color: "#dc2626"}}>
                      Rechazar
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}

const linkBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: 10,
  background: "white",
  border: "1px solid rgba(18,33,26,0.12)",
  textDecoration: "none",
  color: INK,
  fontWeight: 700,
  fontSize: 13,
};

const outlineBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  background: "white",
  border: "1px solid rgba(18,33,26,0.12)",
  color: INK,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

const primaryBtn: React.CSSProperties = {
  background: MAIN,
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};
