"use client";

import {useEffect, useRef, useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Bars3Icon, XMarkIcon} from "@heroicons/react/24/outline";
import {BrandLockup} from "@/components/brand/BrandLockup";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {homePathForRole, isClientRole, isProviderRole} from "@/lib/roles";
import {SHELL_CONTAINER} from "./container";
import {LocationPill} from "./LocationPill";
import {NavItem} from "./NavItem";
import {getPrimaryNav} from "./nav-config";
import {NotificationsBell} from "./Notifications";
import {RailToggleButton, useRailOptional} from "./Rail";
import {SearchBar, useSearchChrome} from "./SearchBar";
import {usePageHeaderResolved} from "./usePageHeader";
import {TopbarButton} from "./TopbarButton";
import {UserMenu} from "./UserMenu";

/** CLIENT desktop dark frame bar — only when CLIENT_USES_SIDEBAR=false. */
export function ClientFrameBar({
  /** When false, do not mount overlay portals (breakpoint twin). */
  mountOverlays = true,
}: {
  mountOverlays?: boolean;
} = {}) {
  const pathname = usePathname() || "";
  const {user, isAuthenticated} = useAuth();
  const {searchActive} = useSearchChrome();
  const homeHref = isAuthenticated ? homePathForRole(user?.role) : "/";
  const topNav = isAuthenticated ? getPrimaryNav("CLIENT") : [];
  const frameRef = useRef<HTMLElement | null>(null);
  const clusterRestRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const rest = clusterRestRef.current;
    const root = frameRef.current;
    if (!rest || !root) return;
    const apply = () => {
      const w = Math.ceil(rest.getBoundingClientRect().width);
      root.style.setProperty("--cluster-rest-w", `${w}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(rest);
    return () => ro.disconnect();
  }, [isAuthenticated, mountOverlays]);

  return (
    <header
      ref={frameRef}
      className="nabbi-frame-bar z-shell-chrome relative shrink-0 text-white"
      data-search-active={searchActive ? "true" : "false"}>
      <div className={`${SHELL_CONTAINER} flex h-16 items-center gap-6`}>
        <BrandLockup
          href={homeHref}
          tone="on-dark"
          variant="full"
          size="md"
          className="shrink-0"
        />

        {isAuthenticated ? (
          <>
            {topNav.length > 0 ? (
              <nav
                className="nabbi-top-nav min-w-0 flex-1"
                aria-label="Principal">
                {topNav.map((item) => (
                  <NavItem
                    key={item.key}
                    item={item}
                    pathname={pathname}
                    variant="top"
                  />
                ))}
              </nav>
            ) : (
              <div className="flex-1" />
            )}

            <div className="nabbi-topbar-cluster ml-auto flex shrink-0 items-center gap-2">
              <SearchBar variant="desktop" />
              <div ref={clusterRestRef} className="nabbi-topbar-cluster__rest">
                <LocationPill mountPopover={mountOverlays} />
                <NotificationsBell mountPopover={mountOverlays} />
              </div>
              <span
                className="mx-0.5 hidden h-5 w-px bg-white/15 sm:block"
                aria-hidden
              />
              <UserMenu tone="on-dark" mountPopover={mountOverlays} />
            </div>
          </>
        ) : (
          <nav className="ml-auto flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className="rounded-full px-3 py-2 text-[14px] font-semibold text-white/80 no-underline hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-full bg-secondary px-3 py-2 text-[13px] font-bold text-secondary-foreground no-underline hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
              Crear cuenta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

/**
 * In-panel topbar (sidebar / web layouts).
 * Left: page title. Right: search + Centro social toggle.
 * Overlay chrome mounts only when `mountOverlays`.
 */
export function PanelTopbar({
  mountOverlays = true,
}: {
  mountOverlays?: boolean;
} = {}) {
  const {title, pageOwnsTitle} = usePageHeaderResolved();
  const {searchActive} = useSearchChrome();
  const rail = useRailOptional();
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const topbarRef = useRef<HTMLDivElement | null>(null);
  const clusterRestRef = useRef<HTMLDivElement | null>(null);
  const pageTitle = title || "nabbi";

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      {threshold: 0, root: el.parentElement},
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const rest = clusterRestRef.current;
    const root = topbarRef.current;
    if (!rest || !root) return;
    const apply = () => {
      const w = Math.ceil(rest.getBoundingClientRect().width);
      root.style.setProperty("--cluster-rest-w", `${w}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(rest);
    return () => ro.disconnect();
  }, [mountOverlays, rail]);

  return (
    <>
      <div
        ref={sentinelRef}
        className="pointer-events-none h-px w-full shrink-0"
        aria-hidden
      />
      <div
        ref={topbarRef}
        className={[
          "nabbi-breadcrumb-bar nabbi-panel-topbar shrink-0",
          scrolled ? "is-stuck nabbi-panel-topbar--scrolled" : "",
        ].join(" ")}
        data-search-active={searchActive ? "true" : "false"}>
        <div className="nabbi-breadcrumb-bar__trail">
          {!pageOwnsTitle && title ? (
            <h1 className="nabbi-breadcrumb-bar__current">{pageTitle}</h1>
          ) : (
            <span className="nabbi-breadcrumb-bar__current">{pageTitle}</span>
          )}
        </div>

        <div className="nabbi-breadcrumb-bar__actions nabbi-topbar-cluster">
          {mountOverlays ? (
            <>
              <SearchBar variant="desktop" />
              <div
                ref={clusterRestRef}
                className="nabbi-topbar-cluster__rest">
                <LocationPill mountPopover={mountOverlays} />
                {rail ? <RailToggleButton /> : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

/** Alias — preferred name for the in-panel chrome bar. */
export const BreadcrumbBar = PanelTopbar;

/** Compact sticky header below lg — mount conditionally (never CSS-hide with portals). */
export function MobileChromeHeader({
  showMenuButton = false,
  onMenuClick,
  menuButtonRef,
  menuExpanded = false,
  mountOverlays = true,
}: {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
  menuButtonRef?: React.RefObject<HTMLButtonElement | null>;
  /** Reflects drawer open state for aria-expanded / icon morph. */
  menuExpanded?: boolean;
  mountOverlays?: boolean;
}) {
  const {user, isAuthenticated} = useAuth();
  const {mobileSearchOpen} = useSearchChrome();
  const {title: pageTitle} = usePageHeaderResolved();
  const rail = useRailOptional();
  const homeHref = isAuthenticated ? homePathForRole(user?.role) : "/";

  return (
    <header className="z-shell-chrome relative sticky top-0 border-b border-card-border bg-background/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div
        className={`${SHELL_CONTAINER} relative flex h-14 items-center gap-2`}
        data-mobile-search={mobileSearchOpen ? "true" : "false"}>
        {showMenuButton ? (
          <TopbarButton
            ref={menuButtonRef}
            variant="icon"
            aria-label={menuExpanded ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuExpanded}
            aria-controls="nabbi-sidebar-drawer"
            onClick={onMenuClick}
            className={mobileSearchOpen ? "invisible" : undefined}
            tabIndex={mobileSearchOpen ? -1 : undefined}>
            <span className="relative inline-flex h-6 w-6 items-center justify-center">
              <Bars3Icon
                className={[
                  "absolute h-6 w-6 transition-all duration-[180ms] motion-reduce:transition-none",
                  menuExpanded
                    ? "rotate-90 scale-75 opacity-0"
                    : "rotate-0 scale-100 opacity-100",
                ].join(" ")}
                aria-hidden
              />
              <XMarkIcon
                className={[
                  "absolute h-6 w-6 transition-all duration-[180ms] motion-reduce:transition-none",
                  menuExpanded
                    ? "rotate-0 scale-100 opacity-100"
                    : "-rotate-90 scale-75 opacity-0",
                ].join(" ")}
                aria-hidden
              />
            </span>
          </TopbarButton>
        ) : null}

        {isAuthenticated && showMenuButton ? (
          <span
            className={[
              "min-w-0 flex-1 truncate text-[15px] font-bold text-foreground",
              mobileSearchOpen ? "invisible" : "",
            ].join(" ")}>
            {pageTitle || "nabbi"}
          </span>
        ) : (
          <BrandLockup
            href={homeHref}
            tone="on-light"
            variant="full"
            size="sm"
            className={[
              "shrink-0",
              mobileSearchOpen ? "invisible" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        )}

        {isAuthenticated ? (
          <div
            className={[
              "flex min-w-0 items-center gap-2",
              mobileSearchOpen
                ? "nabbi-mobile-search-row absolute inset-0 z-10 bg-background pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]"
                : "ml-auto shrink-0",
            ].join(" ")}>
            <SearchBar
              variant="mobile"
              className={mobileSearchOpen ? "w-full min-w-0 flex-1" : undefined}
            />
            {!mobileSearchOpen && mountOverlays && !rail ? (
              <NotificationsBell mountPopover />
            ) : null}
          </div>
        ) : (
          <nav className="ml-auto flex items-center gap-2">
            <Link
              href="/login"
              className="text-[13px] font-semibold text-foreground-secondary no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-secondary px-3 py-2 text-[12px] font-bold text-secondary-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
              Crear cuenta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

/** @deprecated Prefer ClientFrameBar / PanelTopbar / MobileChromeHeader */
export function AppHeader({
  showMenuButton = false,
  onMenuClick,
}: {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}) {
  const {user} = useAuth();
  const client = isClientRole(user?.role) || !isProviderRole(user?.role);
  if (client) {
    return (
      <>
        <ClientFrameBar />
        <MobileChromeHeader
          showMenuButton={showMenuButton}
          onMenuClick={onMenuClick}
        />
      </>
    );
  }
  return (
    <MobileChromeHeader
      showMenuButton={showMenuButton}
      onMenuClick={onMenuClick}
    />
  );
}
