import type {ComponentType, SVGProps} from "react";
import {
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  NewspaperIcon,
  RectangleStackIcon,
  UserCircleIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import {
  BuildingStorefrontIcon as BuildingStorefrontSolid,
  CalendarDaysIcon as CalendarDaysSolid,
  HeartIcon as HeartSolid,
  MagnifyingGlassIcon as MagnifyingGlassSolid,
  NewspaperIcon as NewspaperSolid,
  RectangleStackIcon as RectangleStackSolid,
} from "@heroicons/react/24/solid";

export type AppNavRole = "CLIENT" | "PROFESSIONAL" | "PLACE";
export type NavMatch = "exact" | "prefix";
/** Sidebar sections only — account routes live in `ACCOUNT_ROUTES`, not the nav. */
export type NavSection = "principal" | "negocio";
export type NavBadgeKey = "notifications" | "reservations";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type NavItemConfig = {
  key: string;
  label: string;
  href: string;
  icon: NavIcon;
  iconActive?: NavIcon;
  roles: AppNavRole[];
  badgeKey?: NavBadgeKey;
  match: NavMatch;
  comingSoon?: boolean;
  section: NavSection | "cuenta";
  shortLabel?: string;
  /** Include in mobile bottom nav candidates. */
  mobile?: boolean;
  /** Prefer for the first 4 slots of MobileBottomNav (+ Más). */
  mobilePrimary?: boolean;
  /**
   * Optional collapsible children (group row). Backwards compatible —
   * items without `children` render as flat links.
   */
  children?: NavItemConfig[];
};

/**
 * Non-nav account / support routes — breadcrumbs, titles, and UserMenu
 * reachability. Not rendered in the Sidebar.
 */
export type AccountRouteMeta = {
  key: string;
  label: string;
  href: string;
  match: NavMatch;
  /** Section crumb (non-interactive), e.g. "Cuenta". */
  sectionLabel: string;
  documentTitle: string;
};

export const ACCOUNT_SECTION_LABEL = "Cuenta";

export const ACCOUNT_ROUTES: AccountRouteMeta[] = [
  {
    key: "me",
    label: "Mi cuenta",
    href: "/me",
    match: "prefix",
    sectionLabel: ACCOUNT_SECTION_LABEL,
    documentTitle: "Mi cuenta",
  },
  {
    key: "settings",
    label: "Configuración",
    href: "/notification-preferences",
    match: "prefix",
    sectionLabel: ACCOUNT_SECTION_LABEL,
    documentTitle: "Configuración",
  },
  {
    key: "help",
    label: "Ayuda",
    href: "/help",
    match: "prefix",
    sectionLabel: ACCOUNT_SECTION_LABEL,
    documentTitle: "Ayuda",
  },
  {
    key: "public-profile",
    label: "Mi perfil público",
    href: "/profile",
    match: "exact",
    sectionLabel: ACCOUNT_SECTION_LABEL,
    documentTitle: "Mi perfil público",
  },
];

export function isAccountRouteActive(
  pathname: string,
  route: Pick<AccountRouteMeta, "href" | "match" | "key">,
): boolean {
  if (route.key === "public-profile") {
    return pathname === "/profile";
  }
  if (route.match === "exact") {
    return pathname === route.href;
  }
  return pathname === route.href || pathname.startsWith(`${route.href}/`);
}

/** True when the pathname is any account / support route (user-block active). */
export function isAccountPath(pathname: string): boolean {
  return ACCOUNT_ROUTES.some((r) => isAccountRouteActive(pathname, r));
}

export function getAccountRouteByHref(
  pathname: string,
): AccountRouteMeta | undefined {
  const matches = ACCOUNT_ROUTES.filter((r) =>
    isAccountRouteActive(pathname, r),
  );
  if (!matches.length) return undefined;
  matches.sort((a, b) => b.href.length - a.href.length);
  return matches[0];
}

export function isNavGroup(
  item: NavItemConfig,
): item is NavItemConfig & {children: NavItemConfig[]} {
  return Array.isArray(item.children) && item.children.length > 0;
}

export const NAV_SECTION_LABELS: Record<"principal" | "negocio" | "cuenta", string> =
  {
    principal: "Principal",
    negocio: "Negocio",
    cuenta: "Cuenta",
  };

/**
 * Role-based app navigation. Only real routes are active;
 * missing product surfaces use `comingSoon: true` (disabled + “Pronto”).
 * Account actions (Mi cuenta, Configuración, Ayuda, perfil público) live in
 * the UserMenu — see `ACCOUNT_ROUTES`.
 */
export const NAV_ITEMS: NavItemConfig[] = [
  {
    key: "explore",
    label: "Explorar",
    shortLabel: "Explorar",
    href: "/explore",
    icon: MagnifyingGlassIcon,
    iconActive: MagnifyingGlassSolid,
    roles: ["CLIENT", "PROFESSIONAL", "PLACE"],
    match: "prefix",
    section: "principal",
    mobile: true,
    mobilePrimary: true,
  },
  {
    key: "feed",
    label: "Feed",
    shortLabel: "Feed",
    href: "/feed",
    icon: NewspaperIcon,
    iconActive: NewspaperSolid,
    roles: ["CLIENT", "PROFESSIONAL", "PLACE"],
    match: "prefix",
    section: "principal",
    mobile: true,
    mobilePrimary: true,
  },
  {
    key: "calendar",
    label: "Calendario",
    shortLabel: "Agenda",
    href: "/calendar",
    icon: CalendarDaysIcon,
    iconActive: CalendarDaysSolid,
    roles: ["PROFESSIONAL", "PLACE"],
    match: "prefix",
    section: "principal",
    comingSoon: true,
    mobile: true,
  },
  {
    key: "reservations",
    label: "Reservas",
    shortLabel: "Reservas",
    href: "/reservations",
    icon: RectangleStackIcon,
    iconActive: RectangleStackSolid,
    roles: ["CLIENT", "PROFESSIONAL", "PLACE"],
    badgeKey: "reservations",
    match: "prefix",
    section: "principal",
    mobile: true,
    mobilePrimary: true,
  },
  {
    key: "favoritos",
    label: "Favoritos",
    shortLabel: "Favoritos",
    href: "/favorites",
    icon: HeartIcon,
    iconActive: HeartSolid,
    roles: ["CLIENT", "PROFESSIONAL", "PLACE"],
    match: "prefix",
    section: "principal",
    mobile: true,
  },
  {
    key: "services",
    label: "Servicios",
    href: "/servicios",
    icon: WrenchScrewdriverIcon,
    roles: ["PROFESSIONAL", "PLACE"],
    match: "prefix",
    section: "negocio",
    comingSoon: true,
  },
  {
    key: "sales",
    label: "Ventas",
    href: "/ventas",
    icon: CurrencyDollarIcon,
    roles: ["PROFESSIONAL", "PLACE"],
    match: "prefix",
    section: "negocio",
    comingSoon: true,
  },
  {
    key: "negocio",
    label: "Negocio",
    shortLabel: "Negocio",
    href: "/links",
    icon: BuildingStorefrontIcon,
    iconActive: BuildingStorefrontSolid,
    roles: ["PLACE"],
    match: "prefix",
    section: "negocio",
    children: [
      {
        key: "team",
        label: "Equipo",
        shortLabel: "Equipo",
        href: "/links",
        icon: UserGroupIcon,
        roles: ["PLACE"],
        match: "prefix",
        section: "negocio",
        mobile: true,
        mobilePrimary: true,
      },
      {
        key: "schedule",
        label: "Horario",
        shortLabel: "Horario",
        href: "/schedule",
        icon: ClockIcon,
        roles: ["PLACE"],
        match: "prefix",
        section: "negocio",
      },
    ],
  },
];

/** Header-only items (not primary nav); Avisos lives in the bell slot. */
export const HEADER_AVISOS: NavItemConfig = {
  key: "notifications",
  label: "Avisos",
  href: "/notifications",
  icon: ChatBubbleLeftRightIcon,
  roles: ["CLIENT", "PROFESSIONAL", "PLACE"],
  badgeKey: "notifications",
  match: "prefix",
  section: "principal",
};

export type SidebarCta = {
  href: string;
  label: string;
  icon: NavIcon;
};

/**
 * Optional primary CTA under the logo.
 * Skip when the target equals an existing nav item (e.g. CLIENT /explore).
 * PRO/PLACE: creation flow at /posts/create (no dedicated "Nueva reserva" route).
 */
export function sidebarCtaForRole(role?: string | null): SidebarCta | null {
  const r = normalizeAppRole(role);
  if (r === "CLIENT") {
    /* /explore is already in PRINCIPAL nav — no duplicate CTA */
    return null;
  }
  return {
    href: "/posts/create",
    label: "Crear publicación",
    icon: NewspaperIcon,
  };
}

export function isNavActive(
  pathname: string,
  item: Pick<
    NavItemConfig,
    "href" | "match" | "key" | "comingSoon" | "children"
  >,
): boolean {
  if (item.comingSoon) return false;
  if (item.children?.length) {
    return item.children.some((child) => isNavActive(pathname, child));
  }
  if (item.key === "feed") {
    return (
      pathname === "/feed" ||
      pathname.startsWith("/feed/") ||
      pathname.startsWith("/post/") ||
      pathname.startsWith("/posts/")
    );
  }
  if (item.key === "reservations") {
    return (
      pathname === "/reservations" ||
      pathname.startsWith("/reservations/") ||
      pathname.startsWith("/reservation/") ||
      pathname.startsWith("/booking")
    );
  }
  if (item.match === "exact") {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Flatten groups so mobile / primary helpers see leaf routes. */
export function flattenNavItems(items: NavItemConfig[]): NavItemConfig[] {
  const out: NavItemConfig[] = [];
  for (const item of items) {
    if (item.children?.length) {
      out.push(...flattenNavItems(item.children));
    } else {
      out.push(item);
    }
  }
  return out;
}

export function normalizeAppRole(role?: string | null): AppNavRole {
  const r = (role || "CLIENT").toUpperCase();
  if (r === "PROFESSIONAL" || r === "PLACE") return r;
  return "CLIENT";
}

export function navItemsForRole(role?: string | null): NavItemConfig[] {
  const normalized = normalizeAppRole(role);
  return NAV_ITEMS.filter((item) => item.roles.includes(normalized));
}

/** Leaf items only (groups expanded) for badge / mobile helpers. */
export function navLeavesForRole(role?: string | null): NavItemConfig[] {
  return flattenNavItems(navItemsForRole(role));
}

/** Common items shared by all roles (for skeleton / unknown role). */
export function commonNavItems(): NavItemConfig[] {
  return NAV_ITEMS.filter(
    (item) =>
      item.roles.includes("CLIENT") &&
      item.roles.includes("PROFESSIONAL") &&
      item.roles.includes("PLACE"),
  );
}

export function getPrimaryNav(role?: string | null): NavItemConfig[] {
  return navItemsForRole(role).filter(
    (i) => i.section === "principal" && !i.comingSoon,
  );
}

export function getNavItemByHref(pathname: string): NavItemConfig | undefined {
  const leaves = flattenNavItems(NAV_ITEMS);
  const matches = leaves.filter((item) => isNavActive(pathname, item));
  if (!matches.length) return undefined;
  matches.sort((a, b) => b.href.length - a.href.length);
  return matches[0];
}

/** Bottom nav: up to 4 `mobilePrimary` (else `mobile`), excluding comingSoon. */
export function mobileNavForRole(role?: string | null): NavItemConfig[] {
  const all = navLeavesForRole(role).filter((i) => i.mobile && !i.comingSoon);
  const primary = all.filter((i) => i.mobilePrimary);
  const pool = primary.length ? primary : all;
  return pool.slice(0, 4);
}

export type SidebarSectionGroup = {
  section: NavSection;
  /**
   * Visible sidebar section label. Omit to hide (e.g. sole PRINCIPAL).
   * Breadcrumbs use `breadcrumbLabel` / `NAV_SECTION_LABELS` instead.
   */
  label?: string;
  /** Always present for titles / breadcrumbs (e.g. "Principal"). */
  breadcrumbLabel: string;
  items: NavItemConfig[];
};

export function sidebarSectionsForRole(
  role?: string | null,
): SidebarSectionGroup[] {
  const items =
    role == null || role === ""
      ? commonNavItems()
      : navItemsForRole(role);
  const order: NavSection[] = ["principal", "negocio"];
  return order
    .map((section) => {
      const breadcrumbLabel = NAV_SECTION_LABELS[section];
      /* PRINCIPAL is unlabeled in the sidebar; NEGOCIO keeps its label. */
      const label =
        section === "principal" ? undefined : breadcrumbLabel;
      return {
        section,
        label,
        breadcrumbLabel,
        items: items.filter((i) => i.section === section),
      };
    })
    .filter((g) => g.items.length > 0);
}

export const GUEST_MOBILE_NAV: NavItemConfig[] = [
  {
    key: "feed",
    label: "Feed",
    shortLabel: "Feed",
    href: "/feed",
    icon: NewspaperIcon,
    iconActive: NewspaperSolid,
    roles: ["CLIENT"],
    match: "prefix",
    section: "principal",
    mobile: true,
    mobilePrimary: true,
  },
  {
    key: "explore",
    label: "Explorar",
    shortLabel: "Explorar",
    href: "/explore",
    icon: MagnifyingGlassIcon,
    iconActive: MagnifyingGlassSolid,
    roles: ["CLIENT"],
    match: "prefix",
    section: "principal",
    mobile: true,
    mobilePrimary: true,
  },
  {
    key: "login",
    label: "Entrar",
    shortLabel: "Entrar",
    href: "/login",
    icon: UserCircleIcon,
    roles: ["CLIENT"],
    match: "exact",
    section: "principal",
    mobile: true,
    mobilePrimary: true,
  },
];
