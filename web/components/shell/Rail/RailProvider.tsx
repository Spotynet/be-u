"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {usePathname} from "next/navigation";
import {useMediaQuery} from "@/components/shell/overlay/useMediaQuery";
import {
  RAIL_PANEL_ID,
  RAIL_SECTION_IDS,
  RAIL_WIDTH_MINI,
  RAIL_WIDTH_OPEN,
  RAIL_WIDTH_WIDE,
  SHELL_RAIL_EDGE_MQ,
  SHELL_RAIL_MINI_MQ,
  SHELL_RAIL_OPEN_MQ,
  SHELL_RAIL_WIDE_MQ,
  readDockedPreference,
  writeDockedPreference,
  railPolicyForPath,
  type DockedPreference,
  type RailMode,
  type RailSectionId,
} from "@/components/shell/rail-config";

type RailContextValue = {
  mode: RailMode;
  docked: DockedPreference;
  toggleDocked: () => void;
  setDocked: (d: DockedPreference) => void;
  openOverlay: (sectionId?: RailSectionId) => void;
  closeOverlay: () => void;
  openDrawer: (sectionId?: RailSectionId) => void;
  closeDrawer: () => void;
  /** Expand to A (≥1280), C (1024–1279), or D — with optional section focus. */
  expandToSection: (sectionId?: RailSectionId) => void;
  isHiddenRoute: boolean;
  /** Grid column width for docked rail (0 / 64 / 340 / 380). */
  railWidthPx: number;
  /** data-rail attribute */
  dataRail: RailMode;
  overlayOpen: boolean;
  drawerOpen: boolean;
  /** ≥1280 and policy visible */
  canOpen: boolean | null;
  /** ≥1024 */
  canMini: boolean | null;
  /** 768–1023 edge handle */
  showEdgeHandle: boolean;
  /** ≥1024 show topbar rail toggle */
  showTopbarToggle: boolean;
  panelId: string;
  focusSection: (sectionId?: RailSectionId) => void;
  registerSectionEl: (id: RailSectionId, el: HTMLElement | null) => void;
  /** Live region text for collapsed unread bumps. */
  liveMessage: string;
  /** Pending section to focus after expand mounts. */
  pendingSection: RailSectionId | null;
  clearPendingSection: () => void;

  /* Back-compat aliases used by older callers */
  preferredOpen: boolean;
  dockedOpen: boolean;
  togglePreferred: () => void;
  setPreferredOpen: (open: boolean) => void;
  policy: "visible" | "hidden";
  canDock: boolean | null;
  focusNotifications: () => void;
  registerNotificationsAnchor: (el: HTMLElement | null) => void;
  toggleDrawer: () => void;
};

const RailContext = createContext<RailContextValue | null>(null);

const RESIZE_DEBOUNCE_MS = 100;

export function RailProvider({children}: {children: ReactNode}) {
  const pathname = usePathname() || "";
  const policy = railPolicyForPath(pathname);
  const isHiddenRoute = policy === "hidden";

  const canOpen = useMediaQuery(SHELL_RAIL_OPEN_MQ);
  const canMini = useMediaQuery(SHELL_RAIL_MINI_MQ);
  const canEdge = useMediaQuery(SHELL_RAIL_EDGE_MQ);
  const isWide = useMediaQuery(SHELL_RAIL_WIDE_MQ);

  const [docked, setDockedState] = useState<DockedPreference>("mini");
  const [hydrated, setHydrated] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingSection, setPendingSection] = useState<RailSectionId | null>(
    null,
  );
  const [liveMessage, setLiveMessage] = useState("");
  const sectionEls = useRef<Partial<Record<RailSectionId, HTMLElement>>>({});
  const liveTimer = useRef<number | null>(null);
  const lastLiveAt = useRef(0);

  useEffect(() => {
    setDockedState(readDockedPreference());
    setHydrated(true);
  }, []);

  const setDocked = useCallback((d: DockedPreference) => {
    setDockedState(d);
    writeDockedPreference(d);
  }, []);

  const toggleDocked = useCallback(() => {
    /* Behavior depends on viewport — resolved in consumers via helpers below */
    setDockedState((prev) => {
      const next: DockedPreference = prev === "open" ? "mini" : "open";
      writeDockedPreference(next);
      return next;
    });
  }, []);

  const closeOverlay = useCallback(() => {
    setOverlayOpen(false);
    setPendingSection(null);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setPendingSection(null);
  }, []);

  const focusSection = useCallback((sectionId?: RailSectionId) => {
    const id = sectionId || "notifications";
    const el = sectionEls.current[id];
    if (el) {
      el.scrollIntoView({behavior: "smooth", block: "start"});
      el.focus({preventScroll: true});
    }
  }, []);

  const openOverlay = useCallback(
    (sectionId?: RailSectionId) => {
      setDrawerOpen(false);
      if (sectionId) setPendingSection(sectionId);
      setOverlayOpen(true);
    },
    [],
  );

  const openDrawer = useCallback((sectionId?: RailSectionId) => {
    setOverlayOpen(false);
    if (sectionId) setPendingSection(sectionId);
    setDrawerOpen(true);
  }, []);

  const expandToSection = useCallback(
    (sectionId?: RailSectionId) => {
      if (isHiddenRoute) {
        openDrawer(sectionId);
        return;
      }
      if (canOpen === true) {
        if (sectionId) setPendingSection(sectionId);
        setDocked("open");
        return;
      }
      if (canMini === true) {
        openOverlay(sectionId);
        return;
      }
      openDrawer(sectionId);
    },
    [isHiddenRoute, canOpen, canMini, openDrawer, openOverlay, setDocked],
  );

  /* Route change: close transient only */
  useEffect(() => {
    setOverlayOpen(false);
    setDrawerOpen(false);
    setPendingSection(null);
  }, [pathname]);

  /* Resize: debounce close transient when crossing bands */
  const prevBand = useRef<string | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    const band =
      canOpen === true
        ? "open"
        : canMini === true
          ? "mini"
          : canEdge === true
            ? "edge"
            : "sheet";
    if (prevBand.current == null) {
      prevBand.current = band;
      return;
    }
    if (prevBand.current === band) return;
    const t = window.setTimeout(() => {
      setOverlayOpen(false);
      setDrawerOpen(false);
      setPendingSection(null);
      prevBand.current = band;
    }, RESIZE_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [hydrated, canOpen, canMini, canEdge]);

  /**
   * SSR / pre-hydration: mini (or hidden) to avoid layout shift.
   * After hydration: derive from viewport + preference + transient.
   */
  const mode: RailMode = (() => {
    if (!hydrated || canMini == null) {
      return isHiddenRoute ? "hidden" : "mini";
    }
    if (isHiddenRoute) {
      return drawerOpen ? "drawer" : "hidden";
    }
    if (canOpen === true) {
      if (docked === "open") return "open";
      return "mini";
    }
    if (canMini === true) {
      if (overlayOpen) return "overlay";
      return "mini";
    }
    return drawerOpen ? "drawer" : "hidden";
  })();

  const openWidth =
    isWide === true ? RAIL_WIDTH_WIDE : RAIL_WIDTH_OPEN;

  const railWidthPx = (() => {
    if (mode === "open") return openWidth;
    if (mode === "mini" || mode === "overlay") return RAIL_WIDTH_MINI;
    return 0;
  })();

  const showEdgeHandle =
    hydrated &&
    !isHiddenRoute &&
    canMini === false &&
    canEdge === true;

  const showTopbarToggle =
    hydrated && (canMini === true || isHiddenRoute);

  const registerSectionEl = useCallback(
    (id: RailSectionId, el: HTMLElement | null) => {
      if (el) sectionEls.current[id] = el;
      else delete sectionEls.current[id];
    },
    [],
  );

  const clearPendingSection = useCallback(() => {
    setPendingSection(null);
  }, []);

  const announceUnread = useCallback((n: number) => {
    if (n <= 0) return;
    const now = Date.now();
    if (now - lastLiveAt.current < 30_000) return;
    lastLiveAt.current = now;
    setLiveMessage(
      n === 1
        ? "Tienes 1 notificación nueva"
        : `Tienes ${n} notificaciones nuevas`,
    );
    if (liveTimer.current != null) window.clearTimeout(liveTimer.current);
    liveTimer.current = window.setTimeout(() => setLiveMessage(""), 4000);
  }, []);

  /* Expose announce via ref on window? Better: SocialBell/MiniRail call a method.
     Attach to context: */
  const announceRef = useRef(announceUnread);
  announceRef.current = announceUnread;

  useEffect(() => {
    return () => {
      if (liveTimer.current != null) window.clearTimeout(liveTimer.current);
    };
  }, []);

  const value = useMemo<RailContextValue>(() => {
    const preferredOpen = docked === "open";
    const dockedOpen = mode === "open";

    const togglePreferred = () => {
      if (canOpen === true && !isHiddenRoute) {
        toggleDocked();
        return;
      }
      if (canMini === true && !isHiddenRoute) {
        if (overlayOpen) closeOverlay();
        else openOverlay();
        return;
      }
      if (drawerOpen) closeDrawer();
      else openDrawer();
    };

    return {
      mode,
      docked,
      toggleDocked: () => {
        if (canOpen === true && !isHiddenRoute) {
          toggleDocked();
          return;
        }
        if (canMini === true && !isHiddenRoute) {
          if (overlayOpen) closeOverlay();
          else openOverlay();
          return;
        }
        if (drawerOpen) closeDrawer();
        else openDrawer();
      },
      setDocked,
      openOverlay,
      closeOverlay,
      openDrawer,
      closeDrawer,
      expandToSection,
      isHiddenRoute,
      railWidthPx,
      dataRail: mode,
      overlayOpen,
      drawerOpen,
      canOpen,
      canMini,
      showEdgeHandle,
      showTopbarToggle,
      panelId: RAIL_PANEL_ID,
      focusSection,
      registerSectionEl,
      liveMessage,
      pendingSection,
      clearPendingSection,
      preferredOpen,
      dockedOpen,
      togglePreferred,
      setPreferredOpen: (open: boolean) => setDocked(open ? "open" : "mini"),
      policy,
      canDock: canOpen,
      focusNotifications: () => focusSection("notifications"),
      registerNotificationsAnchor: (el) =>
        registerSectionEl("notifications", el),
      toggleDrawer: () => {
        if (drawerOpen) closeDrawer();
        else openDrawer();
      },
    };
  }, [
    mode,
    docked,
    toggleDocked,
    setDocked,
    openOverlay,
    closeOverlay,
    openDrawer,
    closeDrawer,
    expandToSection,
    isHiddenRoute,
    railWidthPx,
    overlayOpen,
    drawerOpen,
    canOpen,
    canMini,
    showEdgeHandle,
    showTopbarToggle,
    focusSection,
    registerSectionEl,
    liveMessage,
    pendingSection,
    clearPendingSection,
    policy,
  ]);

  return <RailContext.Provider value={value}>{children}</RailContext.Provider>;
}

export function useRail(): RailContextValue {
  const ctx = useContext(RailContext);
  if (!ctx) {
    throw new Error("useRail must be used within RailProvider");
  }
  return ctx;
}

export function useRailOptional(): RailContextValue | null {
  return useContext(RailContext);
}

/** Helper for mini/bell: announce unread while collapsed. */
export function useRailAnnounceCollapsed(
  unreadCount: number,
  collapsed: boolean,
) {
  const rail = useRailOptional();
  const prev = useRef(unreadCount);
  useEffect(() => {
    if (!rail || !collapsed) {
      prev.current = unreadCount;
      return;
    }
    if (unreadCount > prev.current) {
      /* trigger via setting live message through a custom event on document */
      const n = unreadCount - prev.current;
      const detail = unreadCount;
      void n;
      const el = document.getElementById("nabbi-rail-live");
      if (el) {
        const now = Date.now();
        const last = Number(el.dataset.lastAt || 0);
        if (now - last >= 30_000) {
          el.dataset.lastAt = String(now);
          el.textContent =
            detail === 1
              ? "Tienes 1 notificación nueva"
              : `Tienes ${detail} notificaciones nuevas`;
        }
      }
    }
    prev.current = unreadCount;
  }, [unreadCount, collapsed, rail]);
}

void RAIL_SECTION_IDS;
