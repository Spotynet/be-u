"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  HeartIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {CustomDropdown} from "@/components/ui/CustomDropdown";
import {EmptyState} from "@/components/ui/EmptyState";
import {ChipRow} from "@/components/ui/ChipRow";
import {FilterChip} from "@/components/ui/FilterChip";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useLocationFilterOptional} from "@/components/shell/useLocationFilter";
import {useShellOverlay} from "@/components/shell/overlay";
import {notificationApi} from "@/lib/api";
import {AccountSummary} from "../components/AccountSummary";
import {AccountSkeleton} from "../components/AccountSkeleton";
import {EditProfileSheet} from "../components/EditProfileSheet";
import {FavoriteRow} from "../components/FavoriteRow";
import {KpiCard} from "../components/KpiCard";
import {PreferencesPanel} from "../components/PreferencesPanel";
import {
  ReservationRow,
  reservationMonthLabel,
  RESERVATION_STATUS_CONFIG,
} from "@/components/reservations";
import {SecurityPanel} from "../components/SecurityPanel";
import {TabbedCard} from "../components/TabbedCard";
import {useAccountFavorites} from "../hooks/useAccountFavorites";
import {useAccountReservations} from "../hooks/useAccountReservations";
import {useAccountStats} from "../hooks/useAccountStats";
import {
  PERIOD_OPTIONS,
  RESERVA_ESTADO_OPTIONS,
  getAccountVariant,
  type PeriodId,
  type ReservaEstadoId,
} from "../lib/accountVariants";
import {
  filterByEstado,
  filterByPeriod,
  parseEstado,
  parsePeriod,
} from "../lib/period";
import type {AccountViewProps} from "../lib/types";

function formatMemberSince(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const month = d.toLocaleDateString("es-MX", {month: "short"});
  return `${month} ${d.getFullYear()}`;
}

function useAlertsLabel() {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await notificationApi.getPreferences();
        if (cancelled) return;
        const prefs = res.data?.preferences || {};
        const values = Object.values(prefs);
        if (!values.length) {
          setLabel(null);
          return;
        }
        setLabel(
          values.some(Boolean) ? "Avisos activados" : "Avisos desactivados",
        );
      } catch {
        if (!cancelled) setLabel(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return label;
}

function shareHint(
  part: number,
  total: number,
  emptyLabel: string,
): string | null {
  if (total === 0 && part === 0) return emptyLabel;
  if (total <= 0) return null;
  const pct = Math.round((part / total) * 100);
  return `de ${total} reservas · ${pct}%`;
}

const VARIANT = getAccountVariant("CLIENT");

export function ClientAccount({className = ""}: AccountViewProps) {
  const {user, isInitializing} = useAuth();
  const location = useLocationFilterOptional();
  const {open: openOverlay} = useShellOverlay();
  const alertsLabel = useAlertsLabel();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const period = parsePeriod(searchParams.get("periodo"));
  const estado = parseEstado(searchParams.get("estado"));

  const setQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, {scroll: false});
    },
    [pathname, router, searchParams],
  );

  const setPeriod = (id: PeriodId) => setQuery({periodo: id === "all" ? null : id});
  const setEstado = (id: ReservaEstadoId) => {
    setQuery({
      tab: "reservas",
      estado: id === "all" ? null : id,
    });
  };

  const [editOpen, setEditOpen] = useState(false);

  const {
    items,
    loading: resLoading,
    error: resError,
    reload,
  } = useAccountReservations(Boolean(user));
  const stats = useAccountStats(items, period);
  const {
    items: favorites,
    loading: favLoading,
    error: favError,
  } = useAccountFavorites(Boolean(user));

  const listForTab = useMemo(() => {
    const scoped = filterByPeriod(items, period);
    const filtered = filterByEstado(scoped, estado);
    return [...filtered].sort((a, b) => {
      const ta = new Date(
        `${a.date}T${(a.time || "00:00").slice(0, 8)}`,
      ).getTime();
      const tb = new Date(
        `${b.date}T${(b.time || "00:00").slice(0, 8)}`,
      ).getTime();
      return tb - ta;
    });
  }, [items, period, estado]);

  if (isInitializing || !user) {
    return <AccountSkeleton />;
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    user.email ||
    "Usuario";
  const memberSince = formatMemberSince(user.dateJoined);
  const phone =
    user.phoneNumber || (user as {phone?: string}).phone || null;
  const avatar =
    user.profilePicture || (user as {image?: string}).image || null;

  const locLabel = (() => {
    if (!location) return null;
    const city = location.city || location.label;
    if (location.enabled && city) {
      return `${city} · ${location.radiusKm} km`;
    }
    if (city) return city;
    return null;
  })();

  const details = VARIANT.summaryFields
    .map((id) => {
      if (id === "ubicacion") {
        return {
          id,
          label: "Ubicación",
          value: locLabel ? (
            <button
              type="button"
              onClick={() => openOverlay("location")}
              className="text-left font-medium text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-secondary">
              {locLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openOverlay("location")}
              className="font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-secondary">
              Configurar
            </button>
          ),
        };
      }
      if (id === "miembro" && memberSince) {
        return {id, label: "Miembro desde", value: memberSince};
      }
      if (id === "telefono" && phone) {
        return {id, label: "Teléfono", value: phone};
      }
      if (id === "alertas" && alertsLabel) {
        return {id, label: "Alertas", value: alertsLabel};
      }
      return null;
    })
    .filter(Boolean) as {id: string; label: string; value: ReactNode}[];

  const preview = listForTab.slice(0, 8);
  const periodLabel =
    PERIOD_OPTIONS.find((o) => o.id === period)?.label || "Todo el tiempo";

  const kpiHref = (e: ReservaEstadoId) => {
    const p = new URLSearchParams();
    p.set("tab", "reservas");
    if (period !== "all") p.set("periodo", period);
    if (e !== "all") p.set("estado", e);
    return `?${p.toString()}`;
  };

  const completedHint = shareHint(
    stats.completed,
    stats.total,
    "Aún no hay registros",
  );
  const cancelledHint = shareHint(
    stats.cancelled,
    stats.total,
    "Aún no hay registros",
  );

  return (
    <div
      className={[
        "@container/account nabbi-account-client flex w-full min-w-0 flex-col gap-6",
        className,
      ].join(" ")}>
      <AccountSummary
        name={displayName}
        email={user.email}
        role={user.role}
        avatarSrc={avatar}
        verified={Boolean(user.emailVerified)}
        details={details}
        onEdit={() => setEditOpen(true)}
        className="nabbi-account-enter"
      />

      <div className="nabbi-account-enter nabbi-account-enter--1 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[15px] font-semibold text-foreground">Actividad</p>
          <div className="nabbi-period-compact w-auto min-w-[160px] max-w-[220px]">
            <CustomDropdown
              label=""
              value={period}
              onChange={(v) => setPeriod((v as PeriodId) || "all")}
              options={PERIOD_OPTIONS.map((o) => ({
                value: o.id,
                label: o.label,
              }))}
              size="md"
              clearable={false}
              leadingIcon={<CalendarDaysIcon className="h-4 w-4" aria-hidden />}
              placeholder="Todo el tiempo"
            />
          </div>
        </div>

        {resError && !resLoading ? (
          <EmptyState
            title="No pudimos cargar tus métricas"
            description={resError}
            primaryAction={{label: "Reintentar", onClick: reload}}
            size="sm"
          />
        ) : (
          <ul
            className={[
              "m-0 grid list-none gap-4 p-0",
              "@min-[480px]:grid-cols-2",
              "@min-[900px]:grid-cols-4",
            ].join(" ")}
            role="list"
            aria-label={`Indicadores · ${periodLabel}`}>
            <li>
              <KpiCard
                variant="premium"
                label="Reservas totales"
                value={stats.total}
                icon={CalendarDaysIcon}
                tone="brand"
                href={kpiHref("all")}
                loading={resLoading}
                hint={
                  stats.total === 0
                    ? "Aún no hay registros"
                    : "Historial completo"
                }
              />
            </li>
            <li>
              <KpiCard
                variant="premium"
                label={RESERVATION_STATUS_CONFIG.COMPLETED.labelPlural!}
                value={stats.completed}
                icon={CheckCircleIcon}
                tone="success"
                href={kpiHref("completed")}
                loading={resLoading}
                hint={completedHint}
              />
            </li>
            <li>
              <KpiCard
                variant="premium"
                label={RESERVATION_STATUS_CONFIG.CANCELLED.labelPlural!}
                value={stats.cancelled}
                icon={XCircleIcon}
                tone="danger"
                href={kpiHref("cancelled")}
                loading={resLoading}
                hint={cancelledHint}
              />
            </li>
            <li>
              <KpiCard
                variant="premium"
                label="Favoritos"
                value={favorites.length}
                icon={HeartIcon}
                tone="accent"
                href="/favorites"
                loading={favLoading}
                hint={
                  favError
                    ? "No se pudieron cargar"
                    : favorites.length === 0
                      ? "Aún no hay registros"
                      : "Guardados"
                }
              />
            </li>
          </ul>
        )}
      </div>

      <div className="nabbi-account-enter nabbi-account-enter--2">
        <TabbedCard
          defaultTab="reservas"
          tabs={[
            {
              id: "reservas",
              label: "Reservas",
              count: listForTab.length,
              flush: true,
              toolbar: (
                <ChipRow
                  aria-label="Filtrar reservas por estado"
                  mode="single"
                  bleed
                  surface="card">
                  {RESERVA_ESTADO_OPTIONS.map((o) => (
                    <FilterChip
                      key={o.id}
                      label={o.label}
                      selected={estado === o.id}
                      selectionRole="radio"
                      onClick={() => setEstado(o.id)}
                    />
                  ))}
                </ChipRow>
              ),
              content: resLoading ? (
                <div className="nabbi-reservation-list" aria-busy="true">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="grid min-h-[88px] grid-cols-[48px_1fr] gap-x-3 px-4 py-3.5">
                      <div className="h-12 w-12 animate-pulse rounded-xl bg-foreground-muted/15" />
                      <div className="min-w-0 space-y-2 py-0.5">
                        <div className="h-4 w-3/4 max-w-[200px] animate-pulse rounded bg-foreground-muted/15" />
                        <div className="h-3 w-1/2 max-w-[140px] animate-pulse rounded bg-foreground-muted/15" />
                        <div className="mt-2 h-6 w-24 animate-pulse rounded-full bg-foreground-muted/15" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : resError ? (
                <div className="nabbi-reservation-empty px-4">
                  <EmptyState
                    title="No pudimos cargar tus reservas"
                    description={resError}
                    primaryAction={{label: "Reintentar", onClick: reload}}
                    size="sm"
                  />
                </div>
              ) : preview.length === 0 ? (
                <div className="nabbi-reservation-empty px-6 py-2">
                  <EmptyState
                    title="Aún no tienes reservas"
                    description="Cuando reserves un servicio, aparecerá aquí."
                    primaryAction={{
                      label: "Explorar",
                      href: "/explore",
                    }}
                    size="sm"
                  />
                </div>
              ) : (
                <div className="nabbi-reservation-list overflow-hidden">
                  <ul className="m-0 list-none p-0" role="list">
                    {preview.map((r, i) => {
                      const month = reservationMonthLabel(r.date);
                      const prevMonth =
                        i > 0
                          ? reservationMonthLabel(preview[i - 1].date)
                          : "";
                      const showMonth = i === 0 || month !== prevMonth;
                      const multiMonth =
                        preview.length > 1 &&
                        reservationMonthLabel(preview[0].date) !==
                          reservationMonthLabel(
                            preview[preview.length - 1].date,
                          );
                      return (
                        <li key={r.id}>
                          {multiMonth && showMonth && month ? (
                            <p className="nabbi-rr-month">{month}</p>
                          ) : null}
                          <ReservationRow
                            reservation={r}
                            last={i === preview.length - 1}
                            enterIndex={i < 6 ? i : undefined}
                          />
                        </li>
                      );
                    })}
                  </ul>
                  {listForTab.length > 8 ? (
                    <div className="mt-3 px-4 pb-1">
                      <Link
                        href="/reservations"
                        className="inline-flex h-11 w-full items-center justify-center rounded-full border border-card-border text-[13px] font-bold text-primary no-underline outline-none transition-colors hover:bg-foreground-muted/[0.06] focus-visible:ring-2 focus-visible:ring-primary">
                        Ver más
                      </Link>
                    </div>
                  ) : null}
                </div>
              ),
            },
            {
              id: "favoritos",
              label: "Favoritos",
              count: favorites.length,
              content: favLoading ? (
                <p className="text-[13px] text-foreground-secondary">
                  Cargando favoritos…
                </p>
              ) : favError ? (
                <EmptyState
                  title="No pudimos cargar favoritos"
                  description={favError}
                  size="sm"
                />
              ) : favorites.length === 0 ? (
                <EmptyState
                  title="Sin favoritos"
                  description="Guarda profesionales y lugares para verlos aquí."
                  primaryAction={{label: "Explorar", href: "/explore"}}
                  size="sm"
                />
              ) : (
                <div>
                  <ul
                    className="grid list-none gap-0 divide-y divide-card-border p-0 @min-[640px]:grid-cols-2 @min-[640px]:gap-3 @min-[640px]:divide-y-0 @min-[900px]:grid-cols-3"
                    role="list">
                    {favorites.slice(0, 6).map((f) => (
                      <li
                        key={f.id}
                        className="@min-[640px]:rounded-2xl @min-[640px]:border @min-[640px]:border-card-border @min-[640px]:px-2">
                        <FavoriteRow favorite={f} />
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-center">
                    <Link
                      href="/favorites"
                      className="text-[13px] font-bold text-primary no-underline hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      Ver todos los favoritos
                    </Link>
                  </div>
                </div>
              ),
            },
            {
              id: "preferencias",
              label: "Preferencias",
              content: <PreferencesPanel />,
            },
            {
              id: "seguridad",
              label: "Seguridad",
              content: <SecurityPanel />,
            },
          ]}
        />
      </div>

      <EditProfileSheet open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
