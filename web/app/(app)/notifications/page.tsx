"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {BellIcon} from "@heroicons/react/24/outline";
import {
  CardHeader,
  PageHeaderRow,
  StackLayout,
  ToolbarListCard,
} from "@/components/layout";
import {Button} from "@/components/ui/Button";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {useNotifications} from "@/features/notifications";
import {notificationApi, linkApi, errorUtils} from "@/lib/api";

function deepLink(n: {
  data?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  type?: string;
  notification_type?: string;
}): string | null {
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

type Notif = {
  id: number;
  title?: string;
  subject?: string;
  message?: string;
  body?: string;
  content?: string;
  created_at?: string;
  timestamp?: string;
  status?: string;
  is_read?: boolean;
  read?: boolean;
  type?: string;
  notification_type?: string;
  data?: Record<string, unknown>;
  payload?: Record<string, unknown>;
};

export default function NotificationsPage() {
  usePageHeader({title: "Notificaciones", pageOwnsTitle: true});
  const router = useRouter();
  const {
    markRead: markReadShared,
    markAllRead,
    refreshCount,
  } = useNotifications();
  const [items, setItems] = useState<Notif[]>([]);
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
      await refreshCount();
    } catch (err) {
      setMessage(errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [unreadOnly, refreshCount]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: number) => {
    try {
      await markReadShared(id);
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? {...n, status: "read", is_read: true, read: true} : n,
        ),
      );
    } catch {
      /* ignore */
    }
  };

  const markAll = async () => {
    try {
      await markAllRead();
      await load();
    } catch (err) {
      setMessage(errorUtils.getErrorMessage(err));
    }
  };

  const handleOpen = async (n: Notif) => {
    if (!n.is_read && n.status !== "read" && !n.read) {
      await markRead(n.id);
    }
    const href = deepLink(n);
    if (href) router.push(href);
  };

  const handleInvite = async (n: Notif, action: "accept" | "reject") => {
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
      setMessage(
        action === "accept" ? "Invitación aceptada." : "Invitación rechazada.",
      );
      await load();
    } catch (err) {
      setMessage(errorUtils.getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const isInvite = (n: Notif) => {
    const type = String(n.type || n.notification_type || "").toLowerCase();
    const data = n.data || n.payload || {};
    return (
      type.includes("link") ||
      type.includes("invite") ||
      !!(data.link_id || data.linkId)
    );
  };

  const isUnread = (n: Notif) =>
    !(n.is_read || n.read || n.status === "read" || n.status === "READ");

  const activeFilters = unreadOnly ? 1 : 0;

  const chips = useMemo(
    () => (
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtro">
        {(
          [
            [false, "Todas"],
            [true, "No leídas"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={unreadOnly === value}
            onClick={() => setUnreadOnly(value)}
            className={[
              "rounded-full border px-3 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
              unreadOnly === value
                ? "border-transparent bg-primary-light text-primary-dark"
                : "border-card-border bg-card text-foreground-secondary hover:text-foreground",
            ].join(" ")}>
            {label}
          </button>
        ))}
      </div>
    ),
    [unreadOnly],
  );

  return (
    <StackLayout>
      <PageHeaderRow
        title="Notificaciones"
        description="Inbox en la app (sin Web Push)."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/notification-preferences"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-transparent px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Configuración
            </Link>
            <Button type="button" variant="outline" size="sm" onClick={markAll}>
              Marcar todas
            </Button>
          </div>
        }
      />

      <ToolbarListCard
        toolbar={
          <CardHeader
            title="Bandeja"
            description={
              unreadOnly ? "Solo no leídas" : "Todas las notificaciones"
            }
            icon={BellIcon}
            actions={
              activeFilters > 0 ? (
                <span className="inline-flex min-h-10 items-center rounded-full border border-card-border bg-background px-3 text-[12px] font-bold tabular-nums text-foreground-secondary">
                  Filtros · {activeFilters}
                </span>
              ) : null
            }
          />
        }
        chips={chips}>
        {message ? (
          <div className="mb-3 rounded-[var(--control-radius)] border border-success/30 bg-success/10 px-3 py-2.5 text-[14px] text-success">
            {message}
          </div>
        ) : null}

        {loading ? (
          <p className="text-foreground-secondary">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-foreground-secondary">No hay notificaciones.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {items.map((n) => {
              const unread = isUnread(n);
              const invite = isInvite(n);
              return (
                <li
                  key={n.id}
                  className={[
                    "rounded-[var(--tile-radius)] border border-card-border p-3.5",
                    unread ? "bg-primary/10" : "bg-card",
                  ].join(" ")}>
                  <button
                    type="button"
                    onClick={() => handleOpen(n)}
                    className="w-full cursor-pointer border-0 bg-transparent p-0 text-left">
                    <div className="text-[15px] font-extrabold text-foreground">
                      {n.title || n.subject || "Notificación"}
                    </div>
                    <div className="mt-1 text-[13px] text-foreground-secondary">
                      {n.message || n.body || n.content || ""}
                    </div>
                    {n.created_at || n.timestamp ? (
                      <div className="mt-1.5 text-[11px] text-foreground-secondary">
                        {new Date(
                          n.created_at || n.timestamp || "",
                        ).toLocaleString("es-MX")}
                      </div>
                    ) : null}
                  </button>
                  {invite && unread ? (
                    <div className="mt-2.5 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busyId === n.id}
                        onClick={() => handleInvite(n, "accept")}>
                        Aceptar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyId === n.id}
                        onClick={() => handleInvite(n, "reject")}>
                        Rechazar
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </ToolbarListCard>
    </StackLayout>
  );
}
