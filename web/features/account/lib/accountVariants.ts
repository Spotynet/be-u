import {RESERVATION_STATUS_CONFIG} from "@/components/reservations";
import type {AccountRole} from "./types";

export type PeriodId = "all" | "30" | "90" | "year";

export type ReservaEstadoId =
  | "all"
  | "upcoming"
  | "completed"
  | "cancelled";

export type AccountTabId =
  | "reservas"
  | "favoritos"
  | "preferencias"
  | "seguridad";

export type SummaryFieldId =
  | "ubicacion"
  | "miembro"
  | "telefono"
  | "alertas";

export type KpiId =
  | "total"
  | "completed"
  | "cancelled"
  | "favorites";

export type AccountVariantConfig = {
  role: AccountRole;
  subtitle: string;
  summaryFields: SummaryFieldId[];
  kpis: KpiId[];
  tabs: AccountTabId[];
  /** When false, show EmptyState placeholder instead of full dashboard. */
  dashboard: boolean;
  placeholderTitle?: string;
  placeholderDescription?: string;
};

export const PERIOD_OPTIONS: {id: PeriodId; label: string}[] = [
  {id: "all", label: "Todo el tiempo"},
  {id: "30", label: "Últimos 30 días"},
  {id: "90", label: "Últimos 90 días"},
  {id: "year", label: "Este año"},
];

export const RESERVA_ESTADO_OPTIONS: {id: ReservaEstadoId; label: string}[] = [
  {id: "all", label: "Todas"},
  {id: "upcoming", label: "Próximas"},
  {
    id: "completed",
    label: RESERVATION_STATUS_CONFIG.COMPLETED.labelPlural!,
  },
  {
    id: "cancelled",
    label: RESERVATION_STATUS_CONFIG.CANCELLED.labelPlural!,
  },
];

/**
 * Per-role account page config. Views select via registry — no role branching
 * inside shared summary/KPI/tab JSX.
 */
export const accountVariants: Record<AccountRole, AccountVariantConfig> = {
  CLIENT: {
    role: "CLIENT",
    subtitle: "Tu actividad, favoritos y preferencias en un solo lugar.",
    summaryFields: ["ubicacion", "miembro", "telefono", "alertas"],
    kpis: ["total", "completed", "cancelled", "favorites"],
    tabs: ["reservas", "favoritos", "preferencias", "seguridad"],
    dashboard: true,
  },
  PROFESSIONAL: {
    role: "PROFESSIONAL",
    subtitle: "Gestiona tu perfil profesional y tus ajustes.",
    summaryFields: ["ubicacion", "miembro", "telefono"],
    kpis: [],
    tabs: ["preferencias"],
    dashboard: false,
    placeholderTitle: "Panel de profesional en construcción",
    placeholderDescription:
      "Pronto verás tu agenda, ingresos y reseñas aquí. Mientras tanto, gestiona tu perfil público y tus ajustes.",
  },
  PLACE: {
    role: "PLACE",
    subtitle: "Gestiona tu lugar y tus ajustes.",
    summaryFields: ["ubicacion", "miembro", "telefono"],
    kpis: [],
    tabs: ["preferencias"],
    dashboard: false,
    placeholderTitle: "Panel de lugar en construcción",
    placeholderDescription:
      "Pronto verás tu equipo, horarios y ventas aquí. Mientras tanto, gestiona tu perfil público y tus ajustes.",
  },
};

export function getAccountVariant(role: AccountRole): AccountVariantConfig {
  return accountVariants[role] ?? accountVariants.CLIENT;
}
