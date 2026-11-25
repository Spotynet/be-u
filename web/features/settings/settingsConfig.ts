import type {ComponentType, SVGProps} from "react";
import {
  AdjustmentsHorizontalIcon,
  BellAlertIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

export type SettingsSectionId =
  | "notificaciones"
  | "preferencias"
  | "seguridad"
  | "privacidad"
  | "cuenta";

export type SettingsCapability = {
  notifications: boolean;
  /** Theme + location/radius + optional client presentational prefs */
  accountPreferences: boolean;
  theme: boolean;
  location: boolean;
  reduceMotion: boolean;
  language: boolean;
  timezone: boolean;
  timeFormat: boolean;
  distanceUnits: boolean;
  emailReadOnly: boolean;
  emailChange: boolean;
  /** Serializer + web client exist; backend URL may be missing (PARTIAL). */
  changePassword: boolean;
  twoFactor: boolean;
  sessions: boolean;
  connectedAccounts: boolean;
  deleteAccount: boolean;
  logout: boolean;
  legalLinks: boolean;
  dataExport: boolean;
  profileVisibility: boolean;
};

/** Client defaults from discovery — extend later per role. */
export const CLIENT_CAPABILITIES: SettingsCapability = {
  notifications: true,
  accountPreferences: true,
  theme: true,
  location: true,
  reduceMotion: true,
  language: false,
  timezone: false,
  timeFormat: false,
  distanceUnits: false,
  emailReadOnly: true,
  emailChange: false,
  changePassword: true,
  twoFactor: false,
  sessions: true,
  connectedAccounts: false,
  deleteAccount: true,
  logout: true,
  legalLinks: true,
  dataExport: false,
  profileVisibility: false,
};

export type SettingsSectionDef = {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  visible: (caps: SettingsCapability) => boolean;
};

export const SETTINGS_SECTIONS: SettingsSectionDef[] = [
  {
    id: "notificaciones",
    label: "Notificaciones",
    description: "Elige qué avisos quieres recibir",
    icon: BellAlertIcon,
    visible: (c) => c.notifications,
  },
  {
    id: "preferencias",
    label: "Preferencias",
    description: "Idioma, región y cómo ves la información",
    icon: AdjustmentsHorizontalIcon,
    visible: (c) => c.accountPreferences,
  },
  {
    id: "seguridad",
    label: "Seguridad",
    description: "Protege el acceso a tu cuenta",
    icon: ShieldCheckIcon,
    visible: (c) =>
      c.emailReadOnly ||
      c.changePassword ||
      c.sessions ||
      c.twoFactor ||
      c.connectedAccounts,
  },
  {
    id: "privacidad",
    label: "Privacidad y datos",
    description: "Legal y datos personales",
    icon: DocumentTextIcon,
    visible: (c) => c.legalLinks || c.dataExport || c.profileVisibility,
  },
  {
    id: "cuenta",
    label: "Cuenta",
    description: "Sesión y eliminación",
    icon: UserCircleIcon,
    visible: (c) => c.logout || c.deleteAccount,
  },
];

export function visibleSections(
  caps: SettingsCapability = CLIENT_CAPABILITIES,
): SettingsSectionDef[] {
  return SETTINGS_SECTIONS.filter((s) => s.visible(caps));
}
