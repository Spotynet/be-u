"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  CheckIcon,
  EllipsisHorizontalIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {Avatar} from "@/components/ui/Avatar";
import {Tooltip} from "@/components/ui/Tooltip";
import {
  absoluteTimeLabel,
  isOlderThanFourWeeks,
  relativeTimeLabel,
  shortDateLabel,
  type AppNotification,
} from "@/features/notifications";
import {NotificationTypeTile, typeIconMeta} from "./typeIcon";

type Props = {
  n: AppNotification;
  focused?: boolean;
  onFocusItem: () => void;
  onActivate: (opts?: {newTab?: boolean}) => void;
  onToggleRead: () => void;
  onRemove: () => void;
};

const RES_CODE_RE = /\b(RES-[A-Z0-9-]+)\b/gi;

function BodyWithCodes({text}: {text: string}) {
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(RES_CODE_RE.source, "gi");
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(text.slice(last, m.index));
    }
    const full = m[1];
    const short = full.length > 10 ? full.slice(-6) : full;
    parts.push(
      <Tooltip key={`${full}-${m.index}`} content={full} side="top" delay={300}>
        <code className="nabbi-notif-code mx-0.5 inline-block max-w-full align-baseline rounded-md bg-foreground-muted/10 px-1.5 py-0.5 text-[12px] font-medium text-foreground [font-feature-settings:'tnum'] [overflow-wrap:anywhere]">
          {short}
        </code>
      </Tooltip>,
    );
    last = m.index + full.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  if (!parts.length) return <>{text}</>;
  return <>{parts}</>;
}

export function NotificationItem({
  n,
  focused,
  onFocusItem,
  onActivate,
  onToggleRead,
  onRemove,
}: Props) {
  const [rel, setRel] = useState(() => relativeTimeLabel(n.createdAt));
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const abs = absoluteTimeLabel(n.createdAt);
  const old = isOlderThanFourWeeks(n.createdAt);
  const displayTime = old ? shortDateLabel(n.createdAt) : rel;
  const tipTime = old ? rel : abs;
  const menuId = useId();
  const {Icon: MiniIcon} = typeIconMeta(n);

  useEffect(() => {
    setRel(relativeTimeLabel(n.createdAt));
    const t = window.setInterval(() => {
      setRel(relativeTimeLabel(n.createdAt));
    }, 60_000);
    return () => window.clearInterval(t);
  }, [n.createdAt]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const onClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-notif-action]")) {
      e.preventDefault();
      return;
    }
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      onActivate({newTab: true});
      return;
    }
    if (n.href) {
      onActivate({newTab: false});
      return;
    }
    onActivate();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      onToggleRead();
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onActivate();
    }
  };

  const actions = (
    <div
      data-notif-action
      className="flex shrink-0 items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover/notif:opacity-100 md:group-focus-within/notif:opacity-100">
      <Tooltip
        content={n.read ? "Marcar como no leído (M)" : "Marcar como leído (M)"}
        side="top"
        delay={300}
        className="hidden md:inline-flex">
        <button
          type="button"
          data-notif-action
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleRead();
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground-secondary hover:bg-foreground-muted/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={n.read ? "Marcar como no leído" : "Marcar como leído"}>
          {n.read ? (
            <EnvelopeIcon className="h-4 w-4" />
          ) : (
            <EnvelopeOpenIcon className="h-4 w-4" />
          )}
        </button>
      </Tooltip>
      <Tooltip content="Eliminar" side="top" delay={300} className="hidden md:inline-flex">
        <button
          type="button"
          data-notif-action
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground-secondary hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Eliminar aviso">
          <TrashIcon className="h-4 w-4" />
        </button>
      </Tooltip>

      <div className="relative md:hidden" ref={menuRef}>
        <button
          type="button"
          data-notif-action
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? menuId : undefined}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground-secondary hover:bg-foreground-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Más acciones">
          <EllipsisHorizontalIcon className="h-5 w-5" />
        </button>
        {menuOpen ? (
          <div
            id={menuId}
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border border-card-border bg-card py-1 shadow-dropdown">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-foreground hover:bg-foreground-muted/10"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                onToggleRead();
              }}>
              {n.read ? (
                <EnvelopeIcon className="h-4 w-4" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
              {n.read ? "Marcar no leído" : "Marcar leído"}
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-error hover:bg-error/10"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                onRemove();
              }}>
              <TrashIcon className="h-4 w-4" />
              Eliminar
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );

  const actorInitials = (() => {
    const name = n.actor?.name?.trim() || "";
    const parts = name.split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  const leading = n.actor ? (
    <span className="relative h-10 w-10 shrink-0">
      {n.actor.avatarUrl ? (
        <Avatar
          name={n.actor.name}
          src={n.actor.avatarUrl}
          size="lg"
          ringClassName="ring-0"
        />
      ) : (
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-[13px] font-semibold tracking-wide text-primary"
          aria-hidden>
          {actorInitials}
        </span>
      )}
      <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-primary ring-2 ring-card">
        <MiniIcon className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
      </span>
    </span>
  ) : (
    <NotificationTypeTile n={n} />
  );

  const inner = (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span className="min-w-0 flex-1">
            {!n.read ? <span className="sr-only">Sin leer. </span> : null}
            <span
              className={[
                "line-clamp-2 text-[14px] text-foreground",
                n.read ? "font-medium" : "font-semibold",
              ].join(" ")}>
              {n.title}
            </span>
            {n.body ? (
              <span className="mt-0.5 line-clamp-2 block text-[13px] text-foreground-secondary">
                <BodyWithCodes text={n.body} />
              </span>
            ) : null}
            <Tooltip content={tipTime} side="top" delay={400} className="mt-1 inline-flex">
              <time
                dateTime={n.createdAt}
                className="text-[12px] text-foreground-muted">
                {displayTime}
              </time>
            </Tooltip>
            {n.href && n.type === "reservation" ? (
              <span className="mt-2 block">
                <span
                  data-notif-action
                  className="inline-flex h-8 items-center rounded-full border border-primary/20 bg-primary/10 px-3 text-[12px] font-semibold leading-4 text-primary hover:bg-primary/15">
                  Ver reserva
                </span>
              </span>
            ) : null}
          </span>
          {!n.read ? (
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
              aria-hidden
            />
          ) : null}
        </span>
      </span>
      {actions}
    </>
  );

  const rowClass = [
    "group/notif relative mx-2 flex min-h-[72px] items-start gap-3 rounded-[14px] px-4 py-3 text-left transition-colors",
    "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0",
    n.read
      ? "hover:bg-foreground-muted/8"
      : "bg-primary/[0.06] dark:bg-primary/10 hover:bg-primary/[0.1]",
  ].join(" ");

  if (n.href) {
    return (
      <li>
        <Link
          href={n.href}
          tabIndex={focused ? 0 : -1}
          data-notif-focused={focused ? "true" : undefined}
          onFocus={onFocusItem}
          onClick={onClick}
          onKeyDown={onKeyDown}
          className={[rowClass, "no-underline"].join(" ")}>
          {inner}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        tabIndex={focused ? 0 : -1}
        data-notif-focused={focused ? "true" : undefined}
        onFocus={onFocusItem}
        onClick={onClick}
        onKeyDown={onKeyDown}
        className={["w-full", rowClass].join(" ")}>
        {inner}
      </button>
    </li>
  );
}
