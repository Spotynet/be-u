"use client";

import {useEffect, useId, useRef, type ReactNode, type Ref} from "react";
import Link from "next/link";
import {
  BellIcon,
  CalendarDaysIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {Avatar} from "@/components/ui/Avatar";
import {StatusBadge} from "@/components/reservations";
import {relativeTimeLabel} from "@/features/notifications";
import {RAIL_SECTION_IDS} from "@/components/shell/rail-config";
import {NOTIFICACIONES_HREF} from "./socialLinks";
import {useRail} from "./RailProvider";
import {useSocialCenter} from "./SocialCenterProvider";

function SectionCard({
  title,
  href,
  children,
  sectionRef,
  sectionId,
}: {
  title: string;
  href?: string;
  children: ReactNode;
  sectionRef?: Ref<HTMLElement>;
  sectionId?: string;
}) {
  return (
    <section
      id={sectionId}
      ref={sectionRef}
      tabIndex={-1}
      className="nabbi-social-card min-w-0 outline-none">
      <header className="nabbi-social-card__header">
        <h3 className="nabbi-social-card__title min-w-0 truncate">{title}</h3>
        {href ? (
          <Link
            href={href}
            className="nabbi-social-card__link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
            Ver todo
          </Link>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function SkeletonRows({n = 3}: {n?: number}) {
  return (
    <div className="flex flex-col" aria-hidden>
      {Array.from({length: n}).map((_, i) => (
        <div key={i} className="nabbi-social-row">
          <div className="h-9 w-9 shrink-0 rounded-full bg-primary-light" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-3/5 rounded bg-primary-light" />
            <div className="h-3 w-2/5 rounded bg-background" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorRow({onRetry}: {onRetry: () => void}) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] text-foreground-secondary">No se pudo cargar.</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-[12px] font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
        Reintentar
      </button>
    </div>
  );
}

function dateTile(iso: string) {
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return {day: "—", month: ""};
  return {
    day: String(d.getDate()),
    month: d.toLocaleDateString("es-MX", {month: "short"}).replace(".", ""),
  };
}

export function SocialCenter({
  mode = "docked",
  onClose,
}: {
  mode?: "docked" | "drawer" | "overlay";
  onClose?: () => void;
}) {
  const titleId = useId();
  const {
    upcoming,
    suggestions,
    notifications,
    notificationsLoading,
    unreadCount,
    refreshUpcoming,
    refreshSuggestions,
    markRead,
    markAllRead,
  } = useSocialCenter();
  const {
    registerSectionEl,
    setDocked,
    closeOverlay,
    closeDrawer,
    mode: railMode,
    pendingSection,
    clearPendingSection,
    focusSection,
  } = useRail();

  const upcomingRef = useRef<HTMLElement | null>(null);
  const notifRef = useRef<HTMLElement | null>(null);
  const activityRef = useRef<HTMLElement | null>(null);
  const suggestRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    registerSectionEl("upcoming", upcomingRef.current);
    registerSectionEl("notifications", notifRef.current);
    registerSectionEl("activity", activityRef.current);
    registerSectionEl("suggestions", suggestRef.current);
    return () => {
      registerSectionEl("upcoming", null);
      registerSectionEl("notifications", null);
      registerSectionEl("activity", null);
      registerSectionEl("suggestions", null);
    };
  }, [registerSectionEl, notificationsLoading, upcoming.items, suggestions.items]);

  useEffect(() => {
    if (!pendingSection) return;
    const t = window.setTimeout(() => {
      focusSection(pendingSection);
      clearPendingSection();
    }, 40);
    return () => window.clearTimeout(t);
  }, [pendingSection, focusSection, clearPendingSection]);

  const collapse = () => {
    if (mode === "drawer" || railMode === "drawer") {
      onClose?.();
      closeDrawer();
      return;
    }
    if (mode === "overlay" || railMode === "overlay") {
      onClose?.();
      closeOverlay();
      return;
    }
    setDocked("mini");
  };

  const sortedNotifs = [...notifications]
    .sort((a, b) => Number(a.read) - Number(b.read))
    .slice(0, 5);
  const socialItems = notifications
    .filter((n) => n.type === "social")
    .slice(0, 5);

  return (
    <div
      className="nabbi-social-center flex h-full min-h-0 flex-col"
      aria-labelledby={titleId}>
      <header className="nabbi-social-center__header nabbi-panel-surface__header flex h-16 shrink-0 items-center gap-2 px-5">
        <h2
          id={titleId}
          className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground outline-none"
          tabIndex={-1}
          data-centro-social-title>
          Centro social
        </h2>
        <span id="centro-social-title" className="sr-only">
          Centro social
        </span>
        {unreadCount > 0 ? (
          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold tabular-nums text-secondary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground-secondary hover:bg-[var(--glass-light-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            aria-label="Marcar todo como leído">
            <CheckIcon className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        {/* Docked: collapse via header switch. Drawer/overlay keep an explicit close. */}
        {mode === "drawer" ||
        mode === "overlay" ||
        railMode === "drawer" ||
        railMode === "overlay" ? (
          <button
            type="button"
            onClick={collapse}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground-secondary hover:bg-[var(--glass-light-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            aria-label="Cerrar">
            <XMarkIcon className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </header>

      <div className="nabbi-social-center__scroll nabbi-panel-surface__body scroll-premium flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain">
        {upcoming.loading || upcoming.error || upcoming.items.length > 0 ? (
          <SectionCard
            title="Próximas reservas"
            href="/reservations"
            sectionId={RAIL_SECTION_IDS.upcoming}
            sectionRef={upcomingRef}>
            {upcoming.loading ? <SkeletonRows n={2} /> : null}
            {upcoming.error && !upcoming.loading ? (
              <ErrorRow onRetry={() => void refreshUpcoming()} />
            ) : null}
            {!upcoming.loading && !upcoming.error
              ? upcoming.items.map((r) => {
                  const tile = dateTile(r.date);
                  return (
                    <Link
                      key={r.id}
                      href={r.href}
                      className="mb-2 flex min-h-11 items-center gap-2.5 rounded-[12px] px-1 py-1.5 no-underline last:mb-0 hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                      <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[12px] bg-primary-light text-primary-dark">
                        <span className="text-[14px] font-extrabold leading-none tabular-nums">
                          {tile.day}
                        </span>
                        <span className="text-[9px] font-bold uppercase leading-none">
                          {tile.month}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-foreground">
                          {r.serviceTitle}
                        </span>
                        <span className="block truncate text-[12px] text-foreground-secondary">
                          {r.counterpartName}
                          {r.time ? ` · ${r.time}` : ""}
                        </span>
                      </span>
                      <StatusBadge status={r.status} size="sm" />
                    </Link>
                  );
                })
              : null}
          </SectionCard>
        ) : null}

        <SectionCard
          title="Notificaciones"
          href={NOTIFICACIONES_HREF}
          sectionId={RAIL_SECTION_IDS.notifications}
          sectionRef={notifRef}>
          {notificationsLoading && sortedNotifs.length === 0 ? (
            <SkeletonRows n={4} />
          ) : null}
          {!notificationsLoading && sortedNotifs.length === 0 ? (
            <p className="flex items-center gap-2 text-[13px] text-foreground-secondary">
              <BellIcon className="h-4 w-4 shrink-0" aria-hidden />
              Sin novedades por ahora
            </p>
          ) : null}
          {sortedNotifs.map((n) => (
            <Link
              key={n.id}
              href={n.href || NOTIFICACIONES_HREF}
              onClick={() => {
                if (!n.read) void markRead(n.id);
              }}
              className="mb-1.5 flex min-h-11 items-start gap-2.5 rounded-[12px] px-1 py-1.5 no-underline last:mb-0 hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
              <span className="relative shrink-0">
                {n.actor?.avatarUrl || n.actor?.name ? (
                  <Avatar
                    src={n.actor.avatarUrl}
                    name={n.actor.name}
                    size="sm"
                  />
                ) : (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary">
                    <BellIcon className="h-4 w-4" aria-hidden />
                  </span>
                )}
                {!n.read ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card"
                    aria-hidden
                  />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-[13px] font-medium text-foreground">
                  {n.title}
                  {n.body ? ` — ${n.body}` : ""}
                </span>
                <span className="mt-0.5 block text-[12px] text-foreground-secondary">
                  {relativeTimeLabel(n.createdAt)}
                </span>
              </span>
            </Link>
          ))}
        </SectionCard>

        {socialItems.length > 0 ? (
          <SectionCard
            title="Actividad social"
            sectionId={RAIL_SECTION_IDS.activity}
            sectionRef={activityRef}>
            {socialItems.map((n) => (
              <Link
                key={n.id}
                href={n.href || NOTIFICACIONES_HREF}
                onClick={() => {
                  if (!n.read) void markRead(n.id);
                }}
                className="mb-1.5 block rounded-[12px] px-1 py-1.5 text-[13px] text-foreground no-underline hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                {n.title}
              </Link>
            ))}
          </SectionCard>
        ) : null}

        {suggestions.loading ||
        suggestions.error ||
        suggestions.items.length > 0 ? (
          <SectionCard
            title="Sugeridos para ti"
            href="/explore"
            sectionId={RAIL_SECTION_IDS.suggestions}
            sectionRef={suggestRef}>
            {suggestions.loading ? <SkeletonRows n={3} /> : null}
            {suggestions.error && !suggestions.loading ? (
              <ErrorRow onRetry={() => void refreshSuggestions()} />
            ) : null}
            {!suggestions.loading && !suggestions.error
              ? suggestions.items.map((p) => (
                  <div
                    key={p.id}
                    className="mb-2 flex min-h-11 items-center gap-2.5 last:mb-0">
                    <Avatar
                      src={p.avatarUrl}
                      name={p.name}
                      size="sm"
                      className={
                        p.kind === "place" ? "!rounded-[10px]" : undefined
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {p.name}
                      </p>
                      {p.subtitle ? (
                        <p className="truncate text-[12px] text-foreground-secondary">
                          {p.subtitle}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={p.href}
                      className="inline-flex h-8 shrink-0 items-center rounded-full border border-card-border bg-background px-2.5 text-[12px] font-bold text-foreground no-underline hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                      Ver
                    </Link>
                  </div>
                ))
              : null}
          </SectionCard>
        ) : null}

        {!upcoming.loading &&
        upcoming.items.length === 0 &&
        !suggestions.loading &&
        suggestions.items.length === 0 &&
        sortedNotifs.length === 0 &&
        !notificationsLoading ? (
          <p className="flex items-start gap-2 px-1 text-[13px] text-foreground-secondary">
            <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Tu actividad y sugerencias aparecerán aquí.
          </p>
        ) : null}
      </div>
    </div>
  );
}
