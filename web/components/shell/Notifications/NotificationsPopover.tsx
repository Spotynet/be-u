"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {
  ArrowUpIcon,
  CheckIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import {EmptyState} from "@/components/ui/EmptyState";
import {Skeleton} from "@/components/ui/Skeleton";
import {
  groupByDate,
  NOTIFICATION_PREFERENCES_HREF,
  NOTIFICATIONS_PAGE_HREF,
  useNotifications,
  type AppNotification,
} from "@/features/notifications";
import {HeaderPopover} from "../HeaderPopover";
import {NotificationItem} from "./NotificationItem";

type Props = {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
  /** When true, move focus to the first unread item with a brand focus ring. */
  openedByKeyboard?: boolean;
};

function SkeletonRows() {
  return (
    <div className="space-y-2 px-2 py-3" aria-busy="true">
      {Array.from({length: 5}).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-[14px] px-4 py-3">
          <Skeleton className="h-10 w-10 rounded-[12px]" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationsPopover({
  open,
  onClose,
  triggerRef,
  openedByKeyboard = false,
}: Props) {
  const router = useRouter();
  const {
    filteredItems,
    items,
    unreadCount,
    status,
    listError,
    refreshing,
    offline,
    hasMore,
    tab,
    setTab,
    openList,
    loadMore,
    markRead,
    markUnread,
    markAllRead,
    remove,
  } = useNotifications();

  const titleId = useId();
  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [focusIdx, setFocusIdx] = useState(0);
  const [pendingNew, setPendingNew] = useState(0);
  const prevLen = useRef(0);
  const scrolledDown = useRef(false);
  const didKeyboardFocus = useRef(false);

  useEffect(() => {
    if (!open) return;
    void openList();
  }, [open, openList]);

  useEffect(() => {
    if (!open) {
      prevLen.current = 0;
      setPendingNew(0);
      didKeyboardFocus.current = false;
      return;
    }
    if (items.length > prevLen.current && prevLen.current > 0 && scrolledDown.current) {
      setPendingNew((n) => n + (items.length - prevLen.current));
    }
    prevLen.current = items.length;
  }, [items.length, open]);

  useEffect(() => {
    if (!open) return;
    const firstUnread = filteredItems.findIndex((n) => !n.read);
    setFocusIdx(firstUnread >= 0 ? firstUnread : 0);
  }, [open, filteredItems]);

  useEffect(() => {
    if (!open || !hasMore) return;
    const el = sentinelRef.current;
    const root = listRef.current;
    if (!el || !root) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      {root, rootMargin: "80px"},
    );
    io.observe(el);
    return () => io.disconnect();
  }, [open, hasMore, loadMore, filteredItems.length]);

  const activate = useCallback(
    async (n: AppNotification, opts?: {newTab?: boolean}) => {
      if (!n.read) void markRead(n.id);
      if (opts?.newTab && n.href) {
        window.open(n.href, "_blank", "noopener,noreferrer");
        return;
      }
      /* Rows with href are real <Link>s — only close; Link navigates. */
      if (n.href) {
        onClose();
        return;
      }
      onClose();
      router.push(NOTIFICATIONS_PAGE_HREF);
    },
    [markRead, onClose, router],
  );

  const onListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!filteredItems.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx((i) => Math.min(filteredItems.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusIdx(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setFocusIdx(filteredItems.length - 1);
    }
  };

  useEffect(() => {
    if (!open || !openedByKeyboard) return;
    if (didKeyboardFocus.current) {
      const root = listRef.current;
      const focused = root?.querySelector<HTMLElement>(
        '[data-notif-focused="true"]',
      );
      focused?.focus({preventScroll: true});
      return;
    }
    const root = listRef.current;
    if (!root) return;
    const focused = root.querySelector<HTMLElement>(
      '[data-notif-focused="true"]',
    );
    if (focused) {
      didKeyboardFocus.current = true;
      try {
        focused.focus({preventScroll: true, focusVisible: true} as FocusOptions);
      } catch {
        focused.focus({preventScroll: true});
      }
    }
  }, [focusIdx, open, openedByKeyboard]);

  const groups = groupByDate(filteredItems);
  const showSkeleton = status === "loading" && items.length === 0;
  const showError = status === "error" && items.length === 0;
  const showEmpty = status === "ready" && filteredItems.length === 0;

  return (
    <HeaderPopover
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      width={420}
      align="right"
      offset={12}
      bodyScroll={false}
      sheetMaxHeight="92dvh"
      labelledBy={titleId}
      initialFocus={openedByKeyboard ? "none" : "container"}
      className="flex max-h-[min(640px,80dvh)] flex-col !rounded-[20px]">
      {/* Top progress */}
      {refreshing ? (
        <div
          className="absolute left-0 right-0 top-0 z-10 h-0.5 overflow-hidden bg-primary/15"
          aria-hidden>
          <div className="h-full w-1/3 animate-[nabbi-notif-progress_1.1s_ease-in-out_infinite] bg-primary" />
        </div>
      ) : null}

      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-card-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2
            id={titleId}
            className="text-[16px] font-semibold text-foreground">
            Avisos
          </h2>
          {unreadCount > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[12px] font-bold tabular-nums text-primary">
              {unreadCount >= 100 ? "99+" : unreadCount}
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={unreadCount === 0}
            onClick={() => void markAllRead()}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-primary disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <CheckIcon className="h-4 w-4" aria-hidden />
            Marcar todo como leído
          </button>
          <Link
            href={NOTIFICATION_PREFERENCES_HREF}
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground-secondary no-underline hover:bg-foreground-muted/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Configuración">
            <Cog6ToothIcon className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Filtrar avisos"
        className="mx-4 mt-3 flex shrink-0 rounded-full border border-card-border bg-card p-0.5">
        {(
          [
            {id: "all" as const, label: "Todos"},
            {
              id: "unread" as const,
              label: "Sin leer",
              count: unreadCount,
            },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            className={[
              "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              tab === t.id
                ? "bg-primary-light text-primary-dark"
                : "text-foreground-secondary hover:text-foreground",
            ].join(" ")}>
            {t.label}
            {"count" in t && t.count > 0 ? (
              <span className="tabular-nums opacity-80">
                {t.count >= 100 ? "99+" : t.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div
        ref={listRef}
        className="nabbi-notif-list relative mt-2 min-h-0 flex-1 overflow-y-auto scroll-premium"
        onScroll={(e) => {
          scrolledDown.current = e.currentTarget.scrollTop > 48;
        }}
        onKeyDown={onListKeyDown}>
        {offline && items.length > 0 ? (
          <div
            role="status"
            className="mx-4 mb-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-[12px] font-medium text-foreground">
            Mostrando avisos guardados. Sin conexión.
          </div>
        ) : null}

        {pendingNew > 0 ? (
          <div className="sticky top-2 z-[1] flex justify-center px-4">
            <button
              type="button"
              onClick={() => {
                listRef.current?.scrollTo({top: 0, behavior: "smooth"});
                setPendingNew(0);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card px-3 py-1.5 text-[12px] font-semibold text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <ArrowUpIcon className="h-3.5 w-3.5" aria-hidden />
              {pendingNew} nuevos
            </button>
          </div>
        ) : null}

        {showSkeleton ? <SkeletonRows /> : null}

        {showError ? (
          <EmptyState
            title="No pudimos cargar tus avisos."
            description={listError || undefined}
            size="sm"
            primaryAction={{
              label: "Reintentar",
              onClick: () => void openList(),
            }}
            className="py-8"
          />
        ) : null}

        {showEmpty && tab === "all" ? (
          <EmptyState
            title="Estás al día"
            description="Cuando tengas novedades de tus reservas o mensajes, las verás aquí."
            size="sm"
            className="py-10"
          />
        ) : null}

        {showEmpty && tab === "unread" ? (
          <EmptyState
            title="No tienes avisos sin leer"
            size="sm"
            className="py-10"
            primaryAction={{
              label: "Ver todos",
              onClick: () => setTab("all"),
            }}
          />
        ) : null}

        {!showSkeleton && !showError && filteredItems.length > 0 ? (
          <ul role="list" className="pb-2">
            {groups.map((g) => (
              <li key={g.key} role="presentation">
                <div role="group" aria-labelledby={`notif-g-${g.key}`}>
                  <h3
                    id={`notif-g-${g.key}`}
                    className="sticky top-0 z-[1] bg-card/95 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted backdrop-blur-sm">
                    {g.label}
                  </h3>
                  <ul role="list">
                    {g.items.map((n) => {
                      const idx = filteredItems.findIndex((x) => x.id === n.id);
                      return (
                        <NotificationItem
                          key={n.id}
                          n={n}
                          focused={idx === focusIdx}
                          onFocusItem={() => setFocusIdx(idx)}
                          onActivate={(opts) => void activate(n, opts)}
                          onToggleRead={() => {
                            if (n.read) void markUnread(n.id);
                            else void markRead(n.id);
                          }}
                          onRemove={() => void remove(n.id)}
                        />
                      );
                    })}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {hasMore ? (
          <div ref={sentinelRef} className="flex justify-center py-3">
            <button
              type="button"
              onClick={() => void loadMore()}
              className="text-[12px] font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Cargar más
            </button>
          </div>
        ) : null}
      </div>

      <footer className="shrink-0 border-t border-card-border px-4 py-3">
        <Link
          href={NOTIFICATIONS_PAGE_HREF}
          onClick={onClose}
          className="block text-center text-[14px] font-semibold text-primary no-underline hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Ver todos los avisos
        </Link>
      </footer>
    </HeaderPopover>
  );
}
