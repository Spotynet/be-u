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
import {
  getAccountRouteByHref,
  getNavItemByHref,
  getPrimaryNav,
  NAV_SECTION_LABELS,
  type AppNavRole,
  type NavItemConfig,
} from "@/components/shell/nav-config";
import {usePageTitleVisibility} from "./usePageTitleVisibility";

/** Mirrors PageHeader `variant` — condensed topbar title only when `"compact"`. */
export type PageHeaderChrome = "legacy" | "compact" | "banner";

export type PageHeaderState = {
  /** Section / context label from routeLabels (e.g. "Principal"). */
  label?: string;
  /**
   * EXCEPTION only: when the page does NOT render its own PageHeader/h1,
   * pass `title` and leave `pageOwnsTitle` false so the Topbar renders an h1.
   * Prefer page-owned PageHeader.
   */
  title?: string;
  /**
   * Default true for route defaults. When true, Topbar does not render an h1.
   * Set false only with an explicit `title` for the Topbar fallback h1.
   */
  pageOwnsTitle?: boolean;
  /** Optional primary action(s) on the Topbar right. */
  actions?: ReactNode;
};

type Resolved = {
  /** Section crumb from routeLabels (not from page eyebrow). */
  label: string;
  title: string;
  /** True → Topbar must not render an h1. */
  pageOwnsTitle: boolean;
  actions: ReactNode | null;
  navItem: NavItemConfig | undefined;
  /** False when the compact page header has scrolled out of view. */
  headerInView: boolean;
  /** Active PageHeader chrome; condensed topbar title only when `"compact"`. */
  headerChrome: PageHeaderChrome | null;
};

type PageHeaderContextValue = {
  header: PageHeaderState;
  setHeader: (next: PageHeaderState | null) => void;
  resolved: Resolved;
  registerHeaderEl: (el: HTMLElement | null) => void;
  setHeaderChrome: (v: PageHeaderChrome | null) => void;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

function sectionLabel(section?: keyof typeof NAV_SECTION_LABELS): string {
  if (section && NAV_SECTION_LABELS[section]) return NAV_SECTION_LABELS[section];
  return "Nabbi";
}

function defaultFromRoute(pathname: string, role: AppNavRole): PageHeaderState {
  const item = getNavItemByHref(pathname);
  if (item) {
    return {
      label: sectionLabel(
        item.section === "principal" || item.section === "negocio"
          ? item.section
          : "cuenta",
      ),
      title: item.label,
      pageOwnsTitle: true,
    };
  }
  const account = getAccountRouteByHref(pathname);
  if (account) {
    return {
      label: account.sectionLabel,
      title: account.label,
      pageOwnsTitle: true,
    };
  }
  const primary = getPrimaryNav(role);
  const match = primary.find(
    (n) => pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href)),
  );
  if (match) {
    return {
      label: sectionLabel(match.section),
      title: match.label,
      pageOwnsTitle: true,
    };
  }
  return {
    label: "Nabbi",
    title: "",
    pageOwnsTitle: true,
  };
}

export function PageHeaderProvider({
  role,
  children,
}: {
  role: AppNavRole;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [override, setOverride] = useState<PageHeaderState | null>(null);
  const [headerChrome, setHeaderChromeState] = useState<PageHeaderChrome | null>(
    null,
  );
  const {headerInView, registerHeaderEl} = usePageTitleVisibility();

  useEffect(() => {
    setOverride(null);
    setHeaderChromeState(null);
  }, [pathname]);

  const setHeader = useCallback((next: PageHeaderState | null) => {
    setOverride(next);
  }, []);

  const setHeaderChrome = useCallback((v: PageHeaderChrome | null) => {
    setHeaderChromeState(v);
  }, []);

  const defaults = useMemo(() => defaultFromRoute(pathname, role), [pathname, role]);
  const merged: PageHeaderState = override
    ? {...defaults, ...override}
    : defaults;

  const navItem = getNavItemByHref(pathname);

  const value = useMemo<PageHeaderContextValue>(
    () => ({
      header: merged,
      setHeader,
      registerHeaderEl,
      setHeaderChrome,
      resolved: {
        label: merged.label ?? "Nabbi",
        title: merged.title ?? "",
        pageOwnsTitle: merged.pageOwnsTitle !== false,
        actions: merged.actions ?? null,
        navItem,
        headerInView,
        headerChrome,
      },
    }),
    [
      merged,
      setHeader,
      navItem,
      headerInView,
      registerHeaderEl,
      setHeaderChrome,
      headerChrome,
    ],
  );

  return (
    <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>
  );
}

/**
 * Topbar optional fallback title / actions.
 *
 * - Default: page owns the h1 via `PageHeader`; Topbar shows no title.
 * - EXCEPTION: `usePageHeader({ title, pageOwnsTitle: false })` — Topbar renders the h1
 *   when the page has no PageHeader of its own.
 */
export function usePageHeader(state?: PageHeaderState | null) {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error("usePageHeader must be used within PageHeaderProvider");
  }

  const {setHeader, resolved} = ctx;
  const actionsRef = useRef(state?.actions);
  actionsRef.current = state?.actions;

  const label = state?.label;
  const title = state?.title;
  const pageOwnsTitle = state?.pageOwnsTitle;
  const enabled = state !== undefined;

  useEffect(() => {
    if (!enabled) return;
    setHeader({
      label,
      title,
      pageOwnsTitle,
      actions: actionsRef.current,
    });
    return () => setHeader(null);
  }, [enabled, label, title, pageOwnsTitle, setHeader]);

  return resolved;
}

export function usePageHeaderResolved() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error("usePageHeaderResolved must be used within PageHeaderProvider");
  }
  return ctx.resolved;
}

/** Used by PageHeader to register the observed header element + chrome mode. */
export function usePageHeaderVisibility() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error("usePageHeaderVisibility must be used within PageHeaderProvider");
  }
  return {
    registerHeaderEl: ctx.registerHeaderEl,
    setHeaderChrome: ctx.setHeaderChrome,
    headerInView: ctx.resolved.headerInView,
    headerChrome: ctx.resolved.headerChrome,
  };
}
