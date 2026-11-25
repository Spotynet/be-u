"use client";

import {Suspense, useEffect, useRef, useState} from "react";
import {usePathname} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {
  NotificationsProvider,
  useNotificationsOptional,
} from "@/features/notifications";
import {isProviderRole} from "@/lib/roles";
import {ToastProvider} from "@/components/ui/Toast";
import {
  ClientFrameBar,
  MobileChromeHeader,
  PanelTopbar,
} from "./AppHeader";
import {SHELL_CONTAINER} from "./container";
import {MobileBottomNav} from "./MobileBottomNav";
import {normalizeAppRole} from "./nav-config";
import {SearchChromeProvider, SearchQueryProvider} from "./SearchBar";
import {
  ShellOverlayProvider,
  useMediaQuery,
  useShellOverlay,
} from "./overlay";
import {LocationOverlayHost} from "./Location/LocationOverlayHost";
import {
  CLIENT_USES_SIDEBAR,
  SHELL_LG_MQ,
  SHOW_MOBILE_BOTTOM_NAV,
} from "./shell-config";
import {Sidebar} from "./Sidebar";
import {useSidebarState} from "./Sidebar/useSidebarState";
import {LocationFilterProvider} from "./useLocationFilter";
import {PageHeaderProvider} from "./usePageHeader";
import {
  MiniRail,
  RailProvider,
  SocialCenter,
  SocialCenterDrawer,
  SocialCenterOverlay,
  SocialCenterProvider,
  SocialEdgeHandle,
  useRail,
} from "./Rail";
import {RAIL_PANEL_ID} from "./rail-config";
import {PanelSurface} from "./PanelSurface";

type Props = {
  children: React.ReactNode;
  /** From server cookie read — avoids pin flash. */
  initialSidebarPinned?: boolean | null;
};

function useShellBadges() {
  const n = useNotificationsOptional();
  return {
    notifications: n?.unreadCount ?? 0,
  };
}

function ShellSocialAside() {
  const {mode, railWidthPx} = useRail();
  if (railWidthPx <= 0) return null;

  const isMini = mode === "mini" || mode === "overlay";
  const showFull = mode === "open";

  return (
    <div
      className={[
        "nabbi-shell-social min-w-0",
        isMini ? "nabbi-shell-social--mini" : "",
        showFull ? "nabbi-shell-social--open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          ["--social-rail-w" as string]: `${railWidthPx}px`,
        } as React.CSSProperties
      }>
      {isMini ? (
        <PanelSurface
          className="nabbi-shell-social__panel nabbi-shell-social__panel--mini"
          scroll={false}
          aria-label="Centro social (compacto)">
          <MiniRail />
        </PanelSurface>
      ) : null}
      {showFull ? (
        <PanelSurface
          as="aside"
          id={RAIL_PANEL_ID}
          className="nabbi-shell-social__panel"
          scroll={false}
          aria-label="Centro social">
          <SocialCenter mode="docked" />
        </PanelSurface>
      ) : null}
    </div>
  );
}

function AppShellInner({
  children,
  initialSidebarPinned = null,
}: Props) {
  const pathname = usePathname() || "";
  const {user, isAuthenticated, isLoading} = useAuth();
  const provider = isProviderRole(user?.role);
  const role = normalizeAppRole(user?.role);
  const showSidebar =
    Boolean(isAuthenticated) && (provider || CLIENT_USES_SIDEBAR);
  const showClientFrameBar =
    Boolean(isAuthenticated) && !provider && !CLIENT_USES_SIDEBAR;
  const showPanelTopbar = showSidebar;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const edgeTouchX = useRef<number | null>(null);
  const {pinned, togglePin, width, liveRef} = useSidebarState(
    user?.id,
    initialSidebarPinned,
  );
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const badges = useShellBadges();
  const {open: openOverlay, close: closeOverlay, closeAll} = useShellOverlay();
  const isLg = useMediaQuery(SHELL_LG_MQ);
  const isDesktop = isLg === true;
  const isMobile = isLg === false;
  const rail = useRail();

  useEffect(() => {
    const el = document.getElementById("nabbi-rail-live");
    if (el && rail.liveMessage) el.textContent = rail.liveMessage;
  }, [rail.liveMessage]);

  useEffect(() => {
    setDrawerOpen(false);
    closeAll();
  }, [pathname, closeAll]);

  useEffect(() => {
    if (isLg === true) {
      setDrawerOpen(false);
      closeOverlay("drawer");
    }
  }, [isLg, closeOverlay]);

  useEffect(() => {
    scrollRef.current?.scrollTo({top: 0});
  }, [pathname]);

  const openDrawer = () => {
    openOverlay("drawer");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    closeOverlay("drawer");
    setDrawerOpen(false);
  };

  useEffect(() => {
    if (!isMobile || !showSidebar || drawerOpen) return;

    const onStart = (e: TouchEvent) => {
      const x = e.touches[0]?.clientX;
      if (x == null || x > 16) {
        edgeTouchX.current = null;
        return;
      }
      edgeTouchX.current = x;
    };
    const onEnd = (e: TouchEvent) => {
      const start = edgeTouchX.current;
      edgeTouchX.current = null;
      if (start == null) return;
      const end = e.changedTouches[0]?.clientX;
      if (end == null) return;
      if (end - start > 60) openDrawer();
    };

    document.addEventListener("touchstart", onStart, {passive: true});
    document.addEventListener("touchend", onEnd, {passive: true});
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, showSidebar, drawerOpen]);

  const dataRail = rail.dataRail;
  const socialW = rail.railWidthPx;

  return (
    <PageHeaderProvider role={role}>
      <div
        className={[
          "nabbi-shell nabbi-shell--frame",
          showSidebar ? "nabbi-shell--with-sidebar" : "nabbi-shell--client",
          showSidebar && !provider ? "nabbi-shell--client-sidebar" : "",
          provider ? "nabbi-shell--provider" : "",
          !SHOW_MOBILE_BOTTOM_NAV ? "nabbi-shell--no-bottom-nav" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        data-sidebar-mode={
          showSidebar ? (pinned ? "expanded" : "collapsed") : undefined
        }
        data-rail={showSidebar ? dataRail : undefined}
        style={
          showSidebar
            ? ({
                ["--sidebar-w" as string]: `${width}px`,
                ["--social-rail-w" as string]: `${socialW}px`,
                ["--rail-w" as string]: `${socialW}px`,
              } as React.CSSProperties)
            : undefined
        }>
        <a href="#contenido-principal" className="nabbi-skip-link">
          Saltar al contenido
        </a>

        <div
          ref={liveRef}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        />
        <div
          id="nabbi-rail-live"
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        />

        {showSidebar ? (
          <Sidebar
            role={isLoading ? null : user?.role}
            pinned={pinned}
            onTogglePin={togglePin}
            drawerOpen={drawerOpen}
            onDrawerClose={closeDrawer}
            badges={badges}
            loading={Boolean(isLoading && isAuthenticated)}
            drawerOpenerRef={menuButtonRef}
            mountDesktopOverlays={isDesktop}
          />
        ) : null}

        {showClientFrameBar && isDesktop ? (
          <ClientFrameBar mountOverlays />
        ) : null}

        {!isAuthenticated && !showSidebar && isDesktop ? (
          <ClientFrameBar mountOverlays={false} />
        ) : null}

        <PanelSurface
          className="nabbi-shell-panel relative min-w-0 flex-1"
          scroll={false}>
          {isMobile ? <LocationOverlayHost /> : null}
          {isMobile ? (
            <MobileChromeHeader
              showMenuButton={showSidebar}
              onMenuClick={drawerOpen ? closeDrawer : openDrawer}
              menuButtonRef={menuButtonRef}
              menuExpanded={drawerOpen}
              mountOverlays
            />
          ) : null}

          <div
            ref={scrollRef}
            className="nabbi-shell-panel__scroll nabbi-panel-surface__body scroll-premium min-h-0 flex-1">
            {showPanelTopbar ? (
              <PanelTopbar mountOverlays={isDesktop} />
            ) : null}
            <main
              id="contenido-principal"
              tabIndex={-1}
              className={[
                "nabbi-shell-main box-border min-w-0 outline-none",
                SHOW_MOBILE_BOTTOM_NAV
                  ? "pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0"
                  : "pb-[env(safe-area-inset-bottom)] lg:pb-0",
              ].join(" ")}>
              <div className={`${SHELL_CONTAINER} py-3 lg:py-5`}>
                {children}
              </div>
            </main>
          </div>
          {showSidebar ? <SocialEdgeHandle /> : null}
        </PanelSurface>

        {showSidebar ? <ShellSocialAside /> : null}
        {showSidebar ? <SocialCenterOverlay /> : null}
        {showSidebar ? <SocialCenterDrawer /> : null}

        {SHOW_MOBILE_BOTTOM_NAV ? (
          <MobileBottomNav
            role={user?.role}
            isAuthenticated={isAuthenticated}
            badges={badges}
            onMoreClick={showSidebar ? openDrawer : undefined}
          />
        ) : null}
      </div>
    </PageHeaderProvider>
  );
}

function AppShellWithRail({children, initialSidebarPinned = null}: Props) {
  return (
    <RailProvider>
      <SocialCenterProvider>
        <AppShellInner initialSidebarPinned={initialSidebarPinned}>
          {children}
        </AppShellInner>
      </SocialCenterProvider>
    </RailProvider>
  );
}

export function AppShell({children, initialSidebarPinned = null}: Props) {
  return (
    <ToastProvider>
      <LocationFilterProvider>
        <SearchChromeProvider>
          <Suspense fallback={null}>
            <SearchQueryProvider>
              <NotificationsProvider>
                <ShellOverlayProvider>
                  <AppShellWithRail initialSidebarPinned={initialSidebarPinned}>
                    {children}
                  </AppShellWithRail>
                </ShellOverlayProvider>
              </NotificationsProvider>
            </SearchQueryProvider>
          </Suspense>
        </SearchChromeProvider>
      </LocationFilterProvider>
    </ToastProvider>
  );
}
