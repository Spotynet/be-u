"use client";

import Link from "next/link";
import {ClockIcon} from "@heroicons/react/24/outline";
import {Avatar} from "@/components/ui/Avatar";
import {useToast} from "@/components/ui/Toast";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useRecentVisits} from "@/features/recent-visits";

type Props = {
  collapsed: boolean;
  onNavigate?: () => void;
};

const PLACE_AVATAR: Record<"place" | "pro", string> = {
  place: "rounded-[var(--r-ctl)]",
  pro: "rounded-full",
};

export function SidebarRecentVisits({collapsed, onNavigate}: Props) {
  const {user} = useAuth();
  const {items, clear} = useRecentVisits(user?.id ?? null);
  const toast = useToast();
  const visible = items.slice(0, collapsed ? 5 : 6);

  const handleClear = () => {
    clear();
    toast.success("Historial borrado");
  };

  if (collapsed) {
    return (
      <div className="nabbi-sidebar-recents nabbi-sidebar-recents--rail flex flex-col items-center gap-2 border-t border-[var(--hairline-dark-surface)] px-1 py-2">
        {visible.length === 0 ? (
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/40"
            title="Visitados recientemente"
            aria-label="Sin visitas recientes">
            <ClockIcon className="h-4 w-4" aria-hidden />
          </span>
        ) : (
          visible.map((v) => (
            <Link
              key={v.id}
              href={v.href}
              onClick={onNavigate}
              title={`${v.name}${v.subtitle ? ` · ${v.subtitle}` : ""}`}
              aria-label={v.name}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
              <Avatar
                src={v.avatarUrl}
                name={v.name}
                size="md"
                className={
                  PLACE_AVATAR[v.kind === "place" ? "place" : "pro"]
                }
                fallbackTone="cta"
              />
            </Link>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="nabbi-sidebar-recents flex min-h-0 flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-1">
        <p className="nabbi-micro-label text-white/45">
          Visitados recientemente
        </p>
        {items.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-medium text-white/55 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
            Limpiar
          </button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="flex items-start gap-2 px-2 py-2 text-[12px] leading-snug text-white/45">
          <ClockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Aquí aparecerán los lugares y profesionales que visites.
        </p>
      ) : (
        <ul className="nabbi-sidebar-recents__list scroll-premium m-0 flex min-h-0 list-none flex-col gap-0.5 overflow-y-auto overscroll-contain p-0">
          {visible.map((v) => (
            <li key={v.id}>
              <Link
                href={v.href}
                onClick={onNavigate}
                className="flex h-12 items-center gap-3 rounded-[var(--r-tile)] px-2 text-white no-underline hover:bg-[var(--glass-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                <Avatar
                  src={v.avatarUrl}
                  name={v.name}
                  size="md"
                  className={
                    PLACE_AVATAR[v.kind === "place" ? "place" : "pro"]
                  }
                  fallbackTone="cta"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">
                    {v.name}
                  </span>
                  {v.subtitle ? (
                    <span className="block truncate text-[11.5px] text-white/60">
                      {v.subtitle}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
