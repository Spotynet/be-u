"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type RefObject,
} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {XMarkIcon} from "@heroicons/react/24/outline";
import {BrandLockup} from "@/components/brand/BrandLockup";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {homePathForRole} from "@/lib/roles";
import {LocationPill} from "@/components/shell/LocationPill";
import {
  isAccountPath,
  sidebarCtaForRole,
  sidebarSectionsForRole,
} from "@/components/shell/nav-config";
import {
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_RAIL,
} from "@/components/shell/shell-config";
import {SidebarPinButton} from "./SidebarPinButton";
import {SidebarSection} from "./SidebarSection";
import {SidebarSkeleton} from "./SidebarSkeleton";
import {SidebarProfileCard} from "./SidebarProfileCard";
import {SidebarRecentVisits} from "./SidebarRecentVisits";
import {SidebarNavIndicator} from "./SidebarNavIndicator";
import {useNavGroups} from "./useNavGroups";
import {useSidebarPeek} from "./useSidebarPeek";

const FOCUSABLE =
  'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

type Props = {
  role?: string | null;
  pinned: boolean;
  onTogglePin: () => void;
  drawerOpen?: boolean;
  onDrawerClose?: () => void;
  badges?: Partial<Record<string, number>>;
  loading?: boolean;
  drawerOpenerRef?: RefObject<HTMLElement | null>;
  /**
   * Desktop aside overlay owners (UserMenu). False on mobile so the
   * drawer owns portals — never CSS-hide twin owners.
   */
  mountDesktopOverlays?: boolean;
};

export type SidebarMode = "expanded" | "collapsed" | "floating" | "mobile";

function SidebarChrome({
  role,
  rail,
  showPin,
  showClose,
  pinned,
  mode,
  onTogglePin,
  onDrawerClose,
  badges,
  navId,
  mountUserOverlay,
  groupIsOpen,
  onGroupOpenChange,
  onRailGroupActivate,
  navRef,
}: {
  role?: string | null;
  rail: boolean;
  showPin: boolean;
  showClose: boolean;
  pinned: boolean;
  mode: SidebarMode;
  onTogglePin: () => void;
  onDrawerClose?: () => void;
  badges?: Partial<Record<string, number>>;
  navId: string;
  mountUserOverlay?: boolean;
  groupIsOpen: (key: string, fallback?: boolean) => boolean;
  onGroupOpenChange: (key: string, open: boolean) => void;
  onRailGroupActivate?: (key: string) => void;
  navRef?: RefObject<HTMLElement | null>;
}) {
  const pathname = usePathname() || "";
  const sections = sidebarSectionsForRole(role);
  const cta = sidebarCtaForRole(role);
  const homeHref = homePathForRole(role);
  const userBlockActive = isAccountPath(pathname);
  const localNavRef = useRef<HTMLElement | null>(null);
  const resolvedNavRef = navRef ?? localNavRef;
  const indicatorKey = `${mode}:${pathname}:${rail ? "rail" : "full"}`;

  return (
    <>
      <div
        className={[
          "nabbi-sidebar__header group/header relative flex h-16 shrink-0 items-center gap-2",
          rail
            ? "justify-start px-3"
            : mode === "floating" || mode === "mobile"
              ? "justify-between px-5"
              : "justify-between px-5",
        ].join(" ")}>
        <BrandLockup
          href={homeHref}
          tone="on-dark"
          variant={rail ? "mark" : "full"}
          size="md"
        />

        {showPin && !rail ? (
          <div className="nabbi-sidebar__header-controls flex items-center gap-1">
            <SidebarPinButton pinned={pinned} onToggle={onTogglePin} />
          </div>
        ) : null}

        {showClose ? (
          <button
            type="button"
            onClick={onDrawerClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--r-ctl)] text-white/70 outline-none hover:bg-[var(--glass-1)] focus-visible:ring-2 focus-visible:ring-secondary"
            aria-label="Cerrar menú">
            <XMarkIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {cta && !rail ? (
        <div className="px-3 pt-1">
          <Link
            href={cta.href}
            onClick={onDrawerClose}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-secondary px-4 text-[14px] font-bold text-secondary-foreground no-underline transition-colors hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--shell-frame-mid)]">
            <cta.icon className="h-5 w-5" aria-hidden />
            {cta.label}
          </Link>
        </div>
      ) : null}
      {cta && rail ? (
        <div className="flex justify-center pt-1">
          <Link
            href={cta.href}
            aria-label={cta.label}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground no-underline hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--shell-frame-mid)]">
            <cta.icon className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      ) : null}

      <div className="nabbi-sidebar__nav-divider shrink-0" aria-hidden />

      <div className="nabbi-sidebar-profile-wrap shrink-0 px-0 py-0">
        <SidebarProfileCard
          collapsed={rail}
          mountPopover={mountUserOverlay !== false}
          active={userBlockActive}
        />
      </div>

      {!rail ? (
        <div className="nabbi-sidebar__nav-divider shrink-0" aria-hidden />
      ) : null}

      <div className="nabbi-sidebar__nav-shell min-h-0 flex-none px-3">
        <nav
          ref={resolvedNavRef}
          id={navId}
          className="nabbi-sidebar__nav relative space-y-4 overflow-visible"
          aria-label="Principal"
          style={
            {
              ["--indicator-y" as string]: "0px",
              ["--indicator-h" as string]: "20px",
              ["--indicator-opacity" as string]: "0",
            } as CSSProperties
          }>
          <SidebarNavIndicator navRef={resolvedNavRef} depsKey={indicatorKey} />
          {sections.map((group) => (
            <SidebarSection
              key={group.section}
              section={group.section}
              label={group.label}
              items={group.items}
              pathname={pathname}
              rail={rail}
              badges={badges}
              onNavigate={onDrawerClose}
              groupIsOpen={groupIsOpen}
              onGroupOpenChange={onGroupOpenChange}
              onRailGroupActivate={onRailGroupActivate}
            />
          ))}
        </nav>
      </div>

      <div
        className={[
          "nabbi-sidebar__recents-wrap mt-6 flex min-h-0 flex-col",
          rail ? "px-2" : "px-3",
        ].join(" ")}>
        {showClose && !rail ? (
          <LocationPill
            forceExpanded
            mountPopover={false}
            className="mb-2 !border-white/15 !bg-white/10 !text-white"
          />
        ) : null}
        <SidebarRecentVisits collapsed={rail} onNavigate={onDrawerClose} />
      </div>
    </>
  );
}

function SidebarInner({
  role,
  pinned,
  onTogglePin,
  drawerOpen = false,
  onDrawerClose,
  badges,
  loading = false,
  drawerOpenerRef,
  mountDesktopOverlays = true,
}: Props) {
  const pathname = usePathname() || "";
  const {user} = useAuth();
  const navId = useId();
  const drawerTitleId = useId();
  const panelRef = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const groups = useNavGroups(user?.id);

  const peekEnabled = mountDesktopOverlays && !pinned;
  const {
    peek,
    rootRef,
    openPeek,
    closePeek,
    onPointerEnter,
    onPointerLeave,
    onFocusCapture,
    onBlurCapture,
  } = useSidebarPeek({enabled: peekEnabled});

  /* Close peek on route change. */
  useEffect(() => {
    closePeek();
  }, [pathname, closePeek]);

  /* Scroll active item into view (dock nav when collapsed; float when open). */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scope =
      !pinned && peek
        ? root.querySelector<HTMLElement>(".nabbi-sidebar__surface--float")
        : root;
    const active = scope?.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({block: "nearest", behavior: "smooth"});
  }, [pathname, pinned, peek, drawerOpen, rootRef]);

  /* Drawer: focus trap, Esc, scroll lock, swipe-left to close. */
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    panel?.querySelectorAll<HTMLElement>(FOCUSABLE)?.[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onDrawerClose?.();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0]?.clientX ?? null;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const start = touchStartX.current;
      touchStartX.current = null;
      if (start == null) return;
      const end = e.changedTouches[0]?.clientX;
      if (end == null) return;
      if (start - end > 60) onDrawerClose?.();
    };

    document.addEventListener("keydown", onKey);
    panel?.addEventListener("touchstart", onTouchStart, {passive: true});
    panel?.addEventListener("touchend", onTouchEnd, {passive: true});

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      panel?.removeEventListener("touchstart", onTouchStart);
      panel?.removeEventListener("touchend", onTouchEnd);
      drawerOpenerRef?.current?.focus?.();
    };
  }, [drawerOpen, onDrawerClose, drawerOpenerRef]);

  const onRailGroupActivate = useCallback(
    (key: string) => {
      groups.setOpen(key, true);
      openPeek(true);
    },
    [groups, openPeek],
  );

  if (loading) {
    return <SidebarSkeleton pinned={pinned} />;
  }

  const dockWidth = pinned
    ? SIDEBAR_WIDTH_EXPANDED
    : SIDEBAR_WIDTH_RAIL;

  const desktopMode: SidebarMode = pinned
    ? "expanded"
    : peek
      ? "floating"
      : "collapsed";

  return (
    <>
      {mountDesktopOverlays ? (
        <aside
          ref={rootRef as React.RefObject<HTMLElement | null>}
          className={[
            "nabbi-sidebar nabbi-sidebar--frame relative flex shrink-0 flex-col",
            !pinned ? "nabbi-sidebar--unpinned" : "nabbi-sidebar--pinned",
            peek && !pinned ? "nabbi-sidebar--peek" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{width: dockWidth}}
          aria-label="Navegación lateral"
          data-sidebar-mode={desktopMode}
          data-open={!pinned ? (peek ? "true" : "false") : undefined}
          data-peek={peek ? "true" : "false"}
          data-pinned={pinned ? "true" : "false"}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          onFocusCapture={onFocusCapture}
          onBlurCapture={onBlurCapture}>
          {pinned ? (
            <div className="nabbi-sidebar__surface flex h-full min-h-0 flex-col">
              <SidebarChrome
                role={role}
                rail={false}
                showPin
                showClose={false}
                pinned
                mode="expanded"
                onTogglePin={onTogglePin}
                badges={badges}
                navId={navId}
                mountUserOverlay
                groupIsOpen={groups.isOpen}
                onGroupOpenChange={groups.setOpen}
                onRailGroupActivate={onRailGroupActivate}
                navRef={navRef}
              />
            </div>
          ) : (
            <>
              {/* Dock rail — always visible when unpinned; covered while float is open. */}
              <div
                className={[
                  "nabbi-sidebar__surface nabbi-sidebar__surface--rail flex h-full min-h-0 flex-col",
                  peek ? "nabbi-sidebar__surface--rail-covered" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-hidden={peek ? true : undefined}>
                <SidebarChrome
                  role={role}
                  rail
                  showPin={false}
                  showClose={false}
                  pinned={false}
                  mode="collapsed"
                  onTogglePin={onTogglePin}
                  badges={badges}
                  navId={navId}
                  mountUserOverlay={false}
                  groupIsOpen={groups.isOpen}
                  onGroupOpenChange={groups.setOpen}
                  onRailGroupActivate={onRailGroupActivate}
                  navRef={peek ? undefined : navRef}
                />
              </div>
              {/* Float card — always mounted while unpinned; visibility via data-open. */}
              <div
                className="nabbi-sidebar__surface nabbi-sidebar__surface--float flex min-h-0 flex-col"
                style={{width: SIDEBAR_WIDTH_EXPANDED}}
                data-open={peek ? "true" : "false"}
                aria-hidden={peek ? undefined : true}
                {...(peek ? {} : {inert: true})}>
                <div className="nabbi-sidebar__float-inner flex min-h-0 flex-1 flex-col">
                  <SidebarChrome
                    role={role}
                    rail={false}
                    showPin
                    showClose={false}
                    pinned={false}
                    mode="floating"
                    onTogglePin={onTogglePin}
                    badges={badges}
                    navId={`${navId}-float`}
                    mountUserOverlay
                    groupIsOpen={groups.isOpen}
                    onGroupOpenChange={groups.setOpen}
                    onRailGroupActivate={onRailGroupActivate}
                    navRef={peek ? navRef : undefined}
                  />
                </div>
              </div>
            </>
          )}
        </aside>
      ) : null}

      {drawerOpen ? (
        <div className="z-shell-drawer fixed inset-0" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
            aria-label="Cerrar menú"
            onClick={onDrawerClose}
          />
          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
            id="nabbi-sidebar-drawer"
            data-sidebar-mode="mobile"
            className="nabbi-sidebar-drawer absolute bottom-0 left-0 top-0 flex w-[min(86vw,320px)] flex-col pt-[env(safe-area-inset-top)] shadow-dropdown motion-safe:animate-[nabbi-drawer-in_220ms_ease-out]">
            <span id={drawerTitleId} className="sr-only">
              Menú
            </span>
            <SidebarChrome
              role={role}
              rail={false}
              showPin={false}
              showClose
              pinned={false}
              mode="mobile"
              onTogglePin={onTogglePin}
              onDrawerClose={onDrawerClose}
              badges={badges}
              navId={`${navId}-drawer`}
              mountUserOverlay
              groupIsOpen={groups.isOpen}
              onGroupOpenChange={groups.setOpen}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}

export const Sidebar = memo(SidebarInner);
