import type {ComponentType, SVGProps} from "react";
import {
  ArrowRightOnRectangleIcon,
  BellIcon,
  BuildingStorefrontIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {isProviderRole} from "@/lib/roles";

export type UserMenuRoleFilter = "all" | "provider";

export type UserMenuItemConfig = {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Who sees this item. */
  roles: UserMenuRoleFilter;
  group: "cuenta" | "ayuda";
};

/**
 * Config-driven menu rows. Only real routes — Favoritos / Reservas stay in
 * the sidebar nav (never duplicate here).
 */
export const USER_MENU_ITEMS: UserMenuItemConfig[] = [
  {
    id: "me",
    label: "Mi cuenta",
    href: "/me",
    icon: UserCircleIcon,
    roles: "all",
    group: "cuenta",
  },
  {
    id: "settings",
    label: "Configuración",
    href: "/notification-preferences",
    icon: Cog6ToothIcon,
    roles: "all",
    group: "cuenta",
  },
  {
    id: "notifications",
    label: "Notificaciones",
    href: "/notifications",
    icon: BellIcon,
    roles: "all",
    group: "cuenta",
  },
  {
    id: "public-profile",
    label: "Mi perfil público",
    href: "/profile",
    icon: UserIcon,
    roles: "provider",
    group: "cuenta",
  },
  {
    id: "business",
    label: "Mi negocio",
    href: "/dashboard",
    icon: BuildingStorefrontIcon,
    roles: "provider",
    group: "cuenta",
  },
  {
    id: "help",
    label: "Ayuda y soporte",
    href: "/help",
    icon: QuestionMarkCircleIcon,
    roles: "all",
    group: "ayuda",
  },
];

export const USER_MENU_LEGAL = [
  {id: "terms", label: "Términos", href: "/terminos-y-condiciones"},
  {id: "privacy", label: "Privacidad", href: "/aviso-de-privacidad"},
] as const;

export const LOGOUT_ICON = ArrowRightOnRectangleIcon;

export function filterMenuItems(
  role?: string | null,
): UserMenuItemConfig[] {
  const provider = isProviderRole(role);
  return USER_MENU_ITEMS.filter((item) => {
    if (item.roles === "provider") return provider;
    return true;
  });
}

export function isMenuItemActive(pathname: string, href: string): boolean {
  if (href === "/profile") return pathname === "/profile";
  return pathname === href || pathname.startsWith(`${href}/`);
}
