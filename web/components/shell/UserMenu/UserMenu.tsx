"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {
  ChevronDownIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import {Avatar} from "@/components/ui/Avatar";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useNotificationsOptional} from "@/features/notifications";
import {HeaderPopover} from "@/components/shell/HeaderPopover";
import {useOverlay} from "@/components/shell/overlay";
import type {ShellChromeTone} from "@/components/shell/shellTone";
import {roleLabelEs} from "@/lib/roles";
import {ThemeSegmented} from "./ThemeSegmented";
import {UserMenuGroup} from "./UserMenuGroup";
import {UserMenuItem} from "./UserMenuItem";
import {
  filterMenuItems,
  isMenuItemActive,
  LOGOUT_ICON,
  USER_MENU_LEGAL,
} from "./userMenuConfig";

type Props = {
  tone?: ShellChromeTone;
  /** Compact avatar+chevron (header), sidebar card, rail avatar, icon kebab, or custom profile hero. */
  variant?: "header" | "sidebar" | "rail" | "icon" | "profile";
  /** Desktop popover placement when not sidebar/rail/profile. */
  placement?: "bottom" | "top";
  className?: string;
  /** When false, trigger only — no portal. */
  mountPopover?: boolean;
  /**
   * Subtle active affordance when the current route is an account route.
   * Driven by ProfileHero / account-path detection via `isAccountPath`.
   */
  active?: boolean;
  /** Custom trigger content for `variant="profile"`. */
  children?: ReactNode;
};

/** Sheet: &lt;768px, or coarse pointer with width &lt;900px. */
function userMenuShouldUseSheet(): boolean {
  if (typeof window === "undefined") return false;
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  const coarseWide =
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(max-width: 899px)").matches;
  return narrow || coarseWide;
}

function updateBodyFades(el: HTMLElement | null) {
  if (!el) return;
  const top = el.scrollTop > 2;
  const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
  el.dataset.fadeTop = top ? "1" : "0";
  el.dataset.fadeBottom = bottom ? "1" : "0";
  el.dataset.scrollable = el.scrollHeight > el.clientHeight + 1 ? "1" : "0";
}

export function UserMenu({
  tone = "on-dark",
  variant = "header",
  placement = "bottom",
  className = "",
  mountPopover = true,
  active = false,
  children,
}: Props) {
  const {user, logout} = useAuth();
  const notifications = useNotificationsOptional();
  const unreadCount = notifications?.unreadCount ?? 0;
  const pathname = usePathname() || "";
  const {open, setOpen, onClose, isOwner} = useOverlay("user-menu", {
    claim: mountPopover,
  });
  const canPortal = mountPopover && isOwner;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const labelId = useId();
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    user?.email ||
    "Usuario";

  const items = useMemo(
    () => filterMenuItems(user?.role),
    [user?.role],
  );
  const cuentaItems = items.filter((i) => i.group === "cuenta");
  const ayudaItems = items.filter((i) => i.group === "ayuda");
  const menuAriaLabel = displayName
    ? `Menú de cuenta de ${displayName}`
    : "Menú de cuenta";

  const LogoutIcon = LOGOUT_ICON;

  /* Close on route change. */
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only pathname
  }, [pathname]);

  useLayoutEffect(() => {
    if (!open || !canPortal) return;
    const body = bodyRef.current;
    if (body) {
      body.scrollTop = 0;
      updateBodyFades(body);
    }
    const focusables = menuRef.current?.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="menuitemradio"]',
    );
    focusables?.[0]?.focus({preventScroll: true});
    focusables?.[0]?.scrollIntoView({block: "nearest"});
  }, [open, canPortal]);

  useEffect(() => {
    if (!open || !canPortal) return;
    const body = bodyRef.current;
    if (!body) return;
    const onScroll = () => updateBodyFades(body);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateBodyFades(body))
        : null;
    ro?.observe(body);
    body.addEventListener("scroll", onScroll, {passive: true});
    updateBodyFades(body);
    return () => {
      body.removeEventListener("scroll", onScroll);
      ro?.disconnect();
    };
  }, [open, canPortal]);

  const focusMenuItem = (el: HTMLElement | undefined) => {
    if (!el) return;
    el.focus({preventScroll: true});
    el.scrollIntoView({block: "nearest"});
  };

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const nodes = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"], [role="menuitemradio"]',
      ) || [],
    );
    if (!nodes.length) return;
    const idx = nodes.indexOf(document.activeElement as HTMLElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusMenuItem(nodes[(idx + 1) % nodes.length]);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      focusMenuItem(nodes[(idx - 1 + nodes.length) % nodes.length]);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      focusMenuItem(nodes[0]);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      focusMenuItem(nodes[nodes.length - 1]);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      triggerRef.current?.focus();
      return;
    }
    if (e.key === "Tab") {
      onClose();
      return;
    }
    /* Typeahead by first letter */
    if (e.key.length === 1 && /[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(e.key)) {
      const letter = e.key.toLowerCase();
      const start = idx + 1;
      for (let i = 0; i < nodes.length; i += 1) {
        const n = nodes[(start + i) % nodes.length];
        const text = (n.textContent || "").trim().toLowerCase();
        if (text.startsWith(letter)) {
          e.preventDefault();
          focusMenuItem(n);
          return;
        }
      }
    }
  };

  const ringOnDark = "ring-[var(--shell-frame-mid)]";
  const ringOnPanel = "ring-background";
  const avatarRing = tone === "on-dark" ? ringOnDark : ringOnPanel;
  const activeAvatarRing =
    active && (variant === "sidebar" || variant === "rail")
      ? "ring-2 ring-secondary ring-offset-2 ring-offset-[var(--shell-frame-mid)]"
      : avatarRing;

  const triggerCls =
    variant === "profile"
      ? [
          "nabbi-user-menu__trigger nabbi-user-menu__trigger--profile relative flex w-full cursor-pointer flex-col items-stretch border-0 bg-transparent p-0 text-inherit outline-none",
          "focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--shell-frame-mid)]",
          active ? "nabbi-user-menu__trigger--active" : "",
        ].join(" ")
      : variant === "sidebar"
        ? [
            "nabbi-user-menu__trigger nabbi-user-menu__trigger--frame relative flex w-full items-center gap-3 rounded-[14px] px-2 py-2 text-left outline-none transition-colors",
            "focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--shell-frame-mid)]",
            active ? "nabbi-user-menu__trigger--active" : "",
          ].join(" ")
        : variant === "rail"
          ? [
              "nabbi-user-menu__trigger nabbi-user-menu__trigger--frame relative inline-flex h-11 w-11 items-center justify-center rounded-full outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--shell-frame-mid)]",
            ].join(" ")
          : variant === "icon"
            ? [
                "nabbi-user-menu__trigger nabbi-user-menu__trigger--frame nabbi-user-menu__trigger--icon relative inline-flex h-9 w-9 items-center justify-center rounded-full outline-none transition-colors",
                "text-white/70 hover:bg-[var(--glass-1)] hover:text-white",
                "focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--shell-frame-mid)]",
              ].join(" ")
            : [
                "nabbi-user-menu__trigger inline-flex h-11 min-w-11 items-center gap-1.5 rounded-full px-1.5 outline-none",
                tone === "on-dark"
                  ? "nabbi-user-menu__trigger--frame focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--shell-frame-mid)]"
                  : "text-foreground hover:bg-foreground-muted/10 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              ].join(" ");

  const chevronCls =
    tone === "on-dark"
      ? "nabbi-user-menu__trigger-icon"
      : "text-foreground-muted";

  const popoverPlacement =
    variant === "rail"
      ? "right"
      : variant === "icon" || variant === "profile"
        ? "bottom"
        : variant === "sidebar"
          ? "top"
          : placement;
  const popoverAlign =
    variant === "icon"
      ? "right"
      : variant === "sidebar" || variant === "rail" || variant === "profile"
        ? "left"
        : "right";

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    onClose();
    logout();
  };

  let rowIndex = 0;
  const nextRowStyle = (): CSSProperties => {
    const i = rowIndex;
    rowIndex += 1;
    return {["--i" as string]: i} as CSSProperties;
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${triggerCls} ${className}`.trim()}
        aria-expanded={open && canPortal}
        aria-haspopup="menu"
        aria-controls={open && canPortal ? labelId : undefined}
        aria-label={
          variant === "icon" || variant === "profile"
            ? "Menú de usuario"
            : variant === "rail"
              ? displayName
              : undefined
        }
        aria-current={active ? "page" : undefined}
        data-active={active ? "true" : undefined}
        data-open={open && canPortal ? "true" : undefined}
        onClick={() => setOpen(!open)}>
        {variant === "profile" && children ? (
          children
        ) : variant === "sidebar" ? (
          <>
            <Avatar
              src={user?.profilePicture}
              name={displayName}
              size="lg"
              fallbackTone="cta"
              ringClassName={activeAvatarRing}
            />
            <span className="min-w-0 flex-1">
              <span className="nabbi-user-menu__trigger-name block truncate text-[14px] font-semibold">
                {displayName}
              </span>
              <span className="nabbi-user-menu__trigger-meta block truncate text-[12px]">
                {roleLabelEs(user?.role)}
              </span>
            </span>
            <span className="relative shrink-0">
              <EllipsisVerticalIcon
                className={[
                  "nabbi-user-menu__trigger-icon h-5 w-5 transition-transform duration-[180ms] ease-out",
                  open && canPortal ? "rotate-90" : "",
                ].join(" ")}
                aria-hidden
              />
              {active ? (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-secondary"
                  aria-hidden
                />
              ) : null}
            </span>
          </>
        ) : variant === "icon" ? (
          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden />
        ) : (
          <>
            <Avatar
              src={user?.profilePicture}
              name={displayName}
              size={variant === "rail" ? "lg" : "md"}
              fallbackTone="cta"
              ringClassName={activeAvatarRing}
              className={variant === "header" ? "h-9 w-9" : undefined}
            />
            {variant === "header" ? (
              <ChevronDownIcon
                className={[
                  "hidden h-4 w-4 lg:block transition-transform duration-[180ms] ease-out",
                  chevronCls,
                  open && canPortal ? "rotate-180" : "",
                ].join(" ")}
                aria-hidden
              />
            ) : null}
            {variant === "rail" && active ? (
              <span
                className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full bg-secondary ring-2 ring-[var(--shell-frame-mid)]"
                aria-hidden
              />
            ) : null}
          </>
        )}
      </button>

      {canPortal ? (
        <HeaderPopover
          open={open}
          onClose={onClose}
          triggerRef={triggerRef}
          width={320}
          align={popoverAlign}
          offset={8}
          edgePadding={8}
          initialFocus="none"
          placement={popoverPlacement}
          bodyScroll={false}
          sheetMaxHeight="min(85dvh, 640px)"
          shouldUseSheet={userMenuShouldUseSheet}
          className="nabbi-user-menu-popover"
          sheetClassName="nabbi-user-menu-sheet"
          hideSheetHandle={false}>
          <div
            ref={menuRef}
            id={labelId}
            role="menu"
            aria-label={menuAriaLabel}
            className="nabbi-user-menu"
            onKeyDown={onMenuKeyDown}>
            <div
              ref={bodyRef}
              tabIndex={-1}
              aria-label="Menú de cuenta"
              className="nabbi-user-menu__body"
              data-fade-top="0"
              data-fade-bottom="0"
              data-scrollable="0">
              {cuentaItems.length ? (
                <UserMenuGroup label="Cuenta">
                  {cuentaItems.map((item) => (
                    <UserMenuItem
                      key={item.id}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={isMenuItemActive(pathname, item.href)}
                      badgeCount={
                        item.id === "notifications" ? unreadCount : 0
                      }
                      onNavigate={onClose}
                      style={nextRowStyle()}
                    />
                  ))}
                </UserMenuGroup>
              ) : null}

              {ayudaItems.length ? (
                <>
                  <div className="nabbi-user-menu__divider" aria-hidden />
                  <UserMenuGroup label="Ayuda">
                    {ayudaItems.map((item) => (
                      <UserMenuItem
                        key={item.id}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        active={isMenuItemActive(pathname, item.href)}
                        onNavigate={onClose}
                        style={nextRowStyle()}
                      />
                    ))}
                  </UserMenuGroup>
                </>
              ) : null}

              <div className="nabbi-user-menu__divider" aria-hidden />

              <UserMenuGroup
                label="Apariencia"
                className="nabbi-user-menu__group--apariencia">
                <ThemeSegmented />
              </UserMenuGroup>
            </div>

            <div className="nabbi-user-menu__footer-zone">
              <div className="nabbi-user-menu__divider" aria-hidden />

              <div role="group" aria-label="Sesión">
                <button
                  type="button"
                  role="menuitem"
                  disabled={loggingOut}
                  style={nextRowStyle()}
                  className={[
                    "nabbi-user-menu__item nabbi-user-menu__item--logout group/row relative flex w-full items-center text-left outline-none",
                    "disabled:pointer-events-none disabled:opacity-60",
                  ].join(" ")}
                  onClick={handleLogout}>
                  <span className="nabbi-user-menu__tile flex shrink-0 items-center justify-center">
                    <LogoutIcon
                      className="nabbi-user-menu__icon"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </span>
                  <span className="nabbi-user-menu__label min-w-0 flex-1 truncate">
                    {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                  </span>
                </button>
              </div>

              <footer className="nabbi-user-menu__footer">
                {USER_MENU_LEGAL.map((link, i) => (
                  <span key={link.id} className="nabbi-user-menu__footer-item">
                    {i > 0 ? (
                      <span className="nabbi-user-menu__footer-sep" aria-hidden>
                        ·
                      </span>
                    ) : null}
                    <Link
                      href={link.href}
                      role="menuitem"
                      className="nabbi-user-menu__footer-link rounded-sm no-underline outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                      onClick={onClose}>
                      {link.label}
                    </Link>
                  </span>
                ))}
              </footer>
            </div>
          </div>
        </HeaderPopover>
      ) : null}
    </>
  );
}
