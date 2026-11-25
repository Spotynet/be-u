"use client";

import type {ReactNode} from "react";
import {
  BellIcon,
  CalendarDaysIcon,
  SparklesIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import {Tooltip} from "@/components/ui/Tooltip";
import {useSocialCenterOptional} from "./SocialCenterProvider";
import {useRail, useRailAnnounceCollapsed} from "./RailProvider";
import type {RailSectionId} from "@/components/shell/rail-config";

function formatBadge(n: number): string {
  if (n <= 0) return "";
  if (n > 9) return "9+";
  return String(n);
}

function MiniIconButton({
  label,
  badge,
  pulse,
  onClick,
  children,
}: {
  label: string;
  badge?: number;
  pulse?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const badgeText = badge && badge > 0 ? formatBadge(badge) : "";
  return (
    <Tooltip content={label} side="left" delay={200} hoverFineOnly>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="nabbi-mini-rail__btn relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground-secondary hover:bg-background-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
        {children}
        {badgeText ? (
          <span
            className={[
              "nabbi-mini-rail__badge absolute -right-0.5 -top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold tabular-nums text-error-foreground ring-2 ring-card",
              pulse ? "nabbi-mini-rail__badge--pulse" : "",
            ]
              .filter(Boolean)
              .join(" ")}>
            {badgeText}
          </span>
        ) : null}
      </button>
    </Tooltip>
  );
}

/**
 * State B — 64px docked strip with section icon buttons.
 */
export function MiniRail() {
  const {expandToSection, mode} = useRail();
  const social = useSocialCenterOptional();
  const unread = social?.unreadCount ?? 0;
  const upcomingCount = social?.upcoming.items.length ?? 0;
  const socialUnread =
    social?.notifications.filter((n) => n.type === "social" && !n.read)
      .length ?? 0;
  const hasSuggestions =
    (social?.suggestions.items.length ?? 0) > 0 ||
    Boolean(social?.suggestions.loading);

  useRailAnnounceCollapsed(unread, mode === "mini");

  const expand = (section?: RailSectionId) => {
    expandToSection(section);
  };

  return (
    <aside
      className="nabbi-mini-rail flex h-full min-h-0 w-full flex-col items-center gap-2 px-2 py-3"
      aria-label="Centro social (compacto)">
      <div className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto overscroll-contain">
        <MiniIconButton
          label={
            unread > 0
              ? `Notificaciones, ${unread} sin leer`
              : "Notificaciones"
          }
          badge={unread}
          onClick={() => expand("notifications")}>
          <BellIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </MiniIconButton>

        {upcomingCount > 0 || social?.upcoming.loading ? (
          <MiniIconButton
            label={
              upcomingCount > 0
                ? `Próximas reservas, ${upcomingCount}`
                : "Próximas reservas"
            }
            badge={upcomingCount}
            onClick={() => expand("upcoming")}>
            <CalendarDaysIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </MiniIconButton>
        ) : null}

        {socialUnread > 0 ? (
          <MiniIconButton
            label={`Actividad social, ${socialUnread} sin leer`}
            badge={socialUnread}
            onClick={() => expand("activity")}>
            <HeartIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </MiniIconButton>
        ) : null}

        {hasSuggestions ? (
          <MiniIconButton
            label="Sugeridos para ti"
            onClick={() => expand("suggestions")}>
            <SparklesIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </MiniIconButton>
        ) : null}
      </div>
    </aside>
  );
}
