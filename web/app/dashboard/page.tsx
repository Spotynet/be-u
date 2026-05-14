"use client";

import {useState, useEffect, useCallback, useRef} from "react";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {ProtectedRoute} from "@/components/layout/ProtectedRoute";
import {serviceApi, reservationApi, reviewApi, publicProfileApi, ventasApi, api} from "@/lib/api";
import {
  HomeIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  PhotoIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  StarIcon,
  ClockIcon,
  UsersIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const INK      = "#12211A";
const DARK     = "#1F3328";
const MAIN     = "#558367";
const ACCENT   = "#F6C531";
const CREAM    = "#FAF8F3";
const LIGHT    = "#E3D8C6";
const LABEL    = "#3d6050";
const MAIN_RGB = "85, 131, 103";

type Section = "resumen" | "reservas" | "servicios" | "galeria" | "perfil" | "ventas";

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDuration(duration: string) {
  if (!duration) return "";
  const parts = duration.split(":");
  if (parts.length >= 2) {
    const h = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    if (h > 0) return `${h}h${m > 0 ? ` ${m}min` : ""}`;
    return `${m} min`;
  }
  return duration;
}

function getLast7Days() {
  return Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("es-MX", {weekday: "short"}).slice(0, 3),
    };
  });
}

const STATUS_CFG: Record<string, {label: string; bg: string; color: string}> = {
  pending:   {label: "Pendiente",  bg: "rgba(245,158,11,0.12)",  color: "#b45309"},
  confirmed: {label: "Confirmada", bg: `rgba(${MAIN_RGB},0.12)`, color: LABEL},
  completed: {label: "Completada", bg: "rgba(34,93,101,0.1)",    color: "#225D65"},
  cancelled: {label: "Cancelada",  bg: "rgba(220,38,38,0.08)",   color: "#dc2626"},
};

// ─── Calendar helpers ─────────────────────────────────────────────────────────
const WEEKDAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const CAL_START_H = 7;
const CAL_END_H   = 22;
const CAL_SLOT_H  = 64; // px per hour

const STATUS_CAL: Record<string, {bg: string; text: string; dot: string}> = {
  pending:   {bg: "#fef9ed", text: "#92400e", dot: "#f59e0b"},
  confirmed: {bg: "#eef5f1", text: LABEL,     dot: MAIN},
  completed: {bg: "#effaf5", text: "#065f46", dot: "#10b981"},
  cancelled: {bg: "#f8fafc", text: "#94a3b8", dot: "#cbd5e1"},
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  d.setHours(0, 0, 0, 0);
  return d;
}
function getWeekDays(date: Date): Date[] {
  const start = getWeekStart(date);
  return Array.from({length: 7}, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
function getMonthMatrix(date: Date): (Date | null)[][] {
  const [y, m] = [date.getFullYear(), date.getMonth()];
  const first = new Date(y, m, 1);
  const last  = new Date(y, m + 1, 0);
  let dow = first.getDay();
  dow = dow === 0 ? 6 : dow - 1; // Monday = 0
  const cells: (Date | null)[] = Array(dow).fill(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(y, m, d));
  while (cells.length % 7) cells.push(null);
  const matrix: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) matrix.push(cells.slice(i, i + 7));
  return matrix;
}
function timeToMins(t: string): number {
  if (!t) return 9 * 60;
  const [h = 9, mm = 0] = t.split(":").map(Number);
  return h * 60 + mm;
}
function durToMins(dur: string): number {
  if (!dur) return 60;
  const p = dur.split(":").map(Number);
  return (p[0] ?? 1) * 60 + (p[1] ?? 0);
}
function rDateStr(r: any): string {
  return r.date ?? (r.created_at?.split?.("T")[0] ?? "");
}
function rClientName(r: any): string {
  return r.user?.firstName
    ? `${r.user.firstName} ${r.user.lastName ?? ""}`.trim()
    : (r.client_name ?? "Cliente");
}
function rServiceName(r: any): string {
  return r.service?.name ?? r.service_name ?? "Servicio";
}

// ─── SVG Bar Chart ─────────────────────────────────────────────────────────────
function BarChart({data}: {data: {label: string; value: number}[]}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 560, H = 160, PL = 30, PB = 26, PT = 12, PR = 8;
  const cW = W - PL - PR;
  const cH = H - PT - PB;
  const step = cW / data.length;
  const bW = step * 0.46;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width: "100%", height: "100%", overflow: "visible"}}>
      {[0.25, 0.5, 0.75, 1].map((f) => {
        const y = PT + cH * (1 - f);
        return (
          <g key={f}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
            <text x={PL - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#94a3b8">
              {Math.round(max * f)}
            </text>
          </g>
        );
      })}
      <line x1={PL} y1={PT + cH} x2={W - PR} y2={PT + cH} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      {data.map((d, i) => {
        const bH = Math.max((d.value / max) * cH, d.value > 0 ? 4 : 0);
        const x = PL + i * step + step / 2 - bW / 2;
        const y = PT + cH - bH;
        return (
          <g key={i}>
            <rect x={x} y={PT} width={bW} height={cH} rx={4} fill={`rgba(${MAIN_RGB},0.05)`} />
            {bH > 0 && <rect x={x} y={y} width={bW} height={bH} rx={4} fill={`rgba(${MAIN_RGB},0.8)`} />}
            {d.value > 0 && (
              <text x={x + bW / 2} y={y - 3} textAnchor="middle" fontSize="8" fill={DARK} fontWeight="700">
                {d.value}
              </text>
            )}
            <text x={x + bW / 2} y={H - 7} textAnchor="middle" fontSize="8" fill="#64748b">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────
function DonutChart({slices}: {slices: {value: number; color: string; label: string}[]}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const cx = 60, cy = 60, R = 50, r = 30;

  if (total === 0) {
    return (
      <svg viewBox="0 0 120 120" style={{width: "100%", height: "100%"}}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={LIGHT} strokeWidth={R - r} />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="900" fill={DARK}>
          0
        </text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize="8" fill="#94a3b8">
          sin datos
        </text>
      </svg>
    );
  }

  let angle = -Math.PI / 2;
  const arcs = slices
    .filter((s) => s.value > 0)
    .map((slice) => {
      const sweep = (slice.value / total) * 2 * Math.PI;
      const cos1 = Math.cos(angle), sin1 = Math.sin(angle);
      const cos2 = Math.cos(angle + sweep), sin2 = Math.sin(angle + sweep);
      const large = sweep > Math.PI ? 1 : 0;
      const d = [
        `M ${cx + R * cos1} ${cy + R * sin1}`,
        `A ${R} ${R} 0 ${large} 1 ${cx + R * cos2} ${cy + R * sin2}`,
        `L ${cx + r * cos2} ${cy + r * sin2}`,
        `A ${r} ${r} 0 ${large} 0 ${cx + r * cos1} ${cy + r * sin1}`,
        "Z",
      ].join(" ");
      angle += sweep;
      return {...slice, d};
    });

  return (
    <svg viewBox="0 0 120 120" style={{width: "100%", height: "100%"}}>
      {arcs.map((arc, i) => (
        <path key={i} d={arc.d} fill={arc.color} stroke="white" strokeWidth="2" />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="900" fill={DARK}>
        {total}
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="8" fill="#94a3b8">
        reservas
      </text>
    </svg>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({h = 20, radius = 8}: {h?: number; radius?: number}) {
  return (
    <div
      style={{
        width: "100%",
        height: h,
        borderRadius: radius,
        background: "linear-gradient(90deg,#e5ece8 25%,#f0f5f2 50%,#e5ece8 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s ease-in-out infinite",
      }}
    />
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ComponentType<{style?: React.CSSProperties}>;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        padding: "18px 20px",
        border: `1.5px solid ${LIGHT}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          flexShrink: 0,
          background: accent ? "rgba(246,197,49,0.12)" : `rgba(${MAIN_RGB},0.1)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon style={{width: 22, height: 22, color: accent ? "#b45309" : MAIN}} />
      </div>
      <div style={{minWidth: 0}}>
        <p
          style={{
            color: "#64748b",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            margin: "0 0 4px",
          }}
        >
          {label}
        </p>
        <p style={{color: DARK, fontSize: 26, fontWeight: 900, margin: 0, lineHeight: 1}}>
          {value}
        </p>
        {sub && <p style={{color: "#94a3b8", fontSize: 11, margin: "4px 0 0"}}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({status}: {status: string}) {
  const cfg = STATUS_CFG[status] ?? {label: status, bg: LIGHT, color: LABEL};
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: cfg.bg,
        color: cfg.color,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{style?: React.CSSProperties}>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        gap: 10,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: `rgba(${MAIN_RGB},0.1)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4,
        }}
      >
        <Icon style={{width: 28, height: 28, color: MAIN}} />
      </div>
      <p style={{color: DARK, fontWeight: 800, fontSize: 17, margin: 0}}>{title}</p>
      <p style={{color: "#64748b", fontSize: 14, margin: 0, maxWidth: 280}}>{description}</p>
      {action && <div style={{marginTop: 8}}>{action}</div>}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end"}}>
      <div>
        <p
          style={{
            color: "#64748b",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            margin: "0 0 2px",
          }}
        >
          {eyebrow}
        </p>
        <h2 style={{color: DARK, fontWeight: 900, fontSize: 22, margin: 0}}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ─── Section: Resumen ────────────────────────────────────────────────────────
function SectionResumen({
  services,
  reservations,
  reviews,
  isLoading,
}: {
  services: any[];
  reservations: any[];
  reviews: any[];
  isLoading: boolean;
}) {
  const days = getLast7Days();

  const barData = days.map((d) => ({
    label: d.label,
    value: reservations.filter((r: any) =>
      (r.date ?? r.created_at ?? "").startsWith(d.date)
    ).length,
  }));

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekRes = reservations.filter(
    (r: any) => new Date(r.date ?? r.created_at) >= weekAgo
  ).length;

  const uniqueClients = new Set(
    reservations.map((r: any) => r.user?.id ?? r.user)
  ).size;
  const activeServices = services.filter((s: any) => s.is_active !== false).length;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
      : "—";

  const donutSlices = [
    {value: reservations.filter((r: any) => r.status === "pending").length,   color: "#f59e0b", label: "Pendientes"},
    {value: reservations.filter((r: any) => r.status === "confirmed").length, color: MAIN,      label: "Confirmadas"},
    {value: reservations.filter((r: any) => r.status === "completed").length, color: "#225D65", label: "Completadas"},
    {value: reservations.filter((r: any) => r.status === "cancelled").length, color: "#d1d5db", label: "Canceladas"},
  ];

  const recent = [...reservations]
    .sort(
      (a, b) =>
        new Date(b.created_at ?? b.date ?? 0).getTime() -
        new Date(a.created_at ?? a.date ?? 0).getTime()
    )
    .slice(0, 5);

  if (isLoading) {
    return (
      <div style={{display: "flex", flexDirection: "column", gap: 20}}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} h={96} radius={20} />)}
        </div>
        <Skeleton h={220} radius={20} />
        <Skeleton h={180} radius={20} />
      </div>
    );
  }

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 20}}>
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={CalendarDaysIcon} label="Reservas esta semana" value={weekRes} sub={`${reservations.length} en total`} />
        <KpiCard icon={BriefcaseIcon}    label="Servicios activos"    value={activeServices} sub={`de ${services.length} totales`} />
        <KpiCard icon={UsersIcon}        label="Clientes únicos"      value={uniqueClients} />
        <KpiCard icon={StarIcon}         label="Valoración media"     value={avgRating} sub={`${reviews.length} reseñas`} accent />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: "20px 22px",
            border: `1.5px solid ${LIGHT}`,
          }}
          className="lg:col-span-2"
        >
          <p style={{color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 2px"}}>
            Actividad
          </p>
          <p style={{color: DARK, fontWeight: 800, fontSize: 16, margin: "0 0 16px"}}>
            Reservas últimos 7 días
          </p>
          <div style={{height: 160}}>
            <BarChart data={barData} />
          </div>
        </div>

        {/* Donut chart */}
        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: "20px 22px",
            border: `1.5px solid ${LIGHT}`,
          }}
        >
          <p style={{color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 2px"}}>
            Estado
          </p>
          <p style={{color: DARK, fontWeight: 800, fontSize: 16, margin: "0 0 14px"}}>
            Reservas
          </p>
          <div style={{display: "flex", alignItems: "center", gap: 14}}>
            <div style={{width: 110, height: 110, flexShrink: 0}}>
              <DonutChart slices={donutSlices} />
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: 7}}>
              {donutSlices.map((s) => (
                <div key={s.label} style={{display: "flex", alignItems: "center", gap: 7}}>
                  <div style={{width: 9, height: 9, borderRadius: "50%", background: s.color, flexShrink: 0}} />
                  <span style={{fontSize: 11, color: "#64748b"}}>{s.label}</span>
                  <span style={{fontSize: 11, fontWeight: 700, color: DARK, marginLeft: "auto", paddingLeft: 6}}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent reservations */}
      <div style={{background: "white", borderRadius: 20, padding: "20px 22px", border: `1.5px solid ${LIGHT}`}}>
        <p style={{color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 2px"}}>
          Última actividad
        </p>
        <p style={{color: DARK, fontWeight: 800, fontSize: 16, margin: "0 0 16px"}}>
          Reservas recientes
        </p>
        {recent.length === 0 ? (
          <EmptyState
            icon={CalendarDaysIcon}
            title="Sin reservas aún"
            description="Las reservas de tus clientes aparecerán aquí."
          />
        ) : (
          <div style={{display: "flex", flexDirection: "column", gap: 8}}>
            {recent.map((r: any, i: number) => {
              const clientName = r.user?.firstName
                ? `${r.user.firstName} ${r.user.lastName ?? ""}`.trim()
                : r.client_name ?? "Cliente";
              const serviceName = r.service?.name ?? r.service_name ?? "Servicio";
              const dateStr = r.date ? formatDate(r.date) : r.created_at ? formatDate(r.created_at) : "—";
              return (
                <div
                  key={r.id ?? i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 14px",
                    borderRadius: 14,
                    background: CREAM,
                    border: `1px solid ${LIGHT}`,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: `rgba(${MAIN_RGB},0.12)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{color: MAIN, fontWeight: 800, fontSize: 14}}>
                      {clientName[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{flex: 1, minWidth: 0}}>
                    <p style={{color: DARK, fontWeight: 700, fontSize: 13, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                      {clientName}
                    </p>
                    <p style={{color: "#64748b", fontSize: 12, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                      {serviceName} · {dateStr}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────
function ActionBtn({children, onClick, disabled, bg, color, title}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  bg: string;
  color: string;
  title: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{width: 32, height: 32, borderRadius: 10, background: bg, border: "none",
        cursor: disabled ? "wait" : "pointer", display: "flex", alignItems: "center",
        justifyContent: "center", color, opacity: disabled ? 0.5 : 1, transition: "opacity 0.15s"}}>
      {children}
    </button>
  );
}

// ─── ResChip — compact event pill for month view ──────────────────────────────
function ResChip({r, onClick}: {r: any; onClick: (e: React.MouseEvent) => void}) {
  const cfg = STATUS_CAL[r.status] ?? STATUS_CAL.pending;
  return (
    <div onClick={onClick} style={{
      background: cfg.bg, color: cfg.text,
      borderLeft: `2.5px solid ${cfg.dot}`,
      borderRadius: 4, padding: "1px 5px",
      fontSize: 10, fontWeight: 700, marginBottom: 2, cursor: "pointer",
      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    }}>
      {r.time ? r.time.slice(0, 5) + " " : ""}{rClientName(r)}
    </div>
  );
}

// ─── ResBlock — positioned event block for week/day views ────────────────────
function ResBlock({r, top, height, onClick, compact}: {
  r: any; top: number; height: number; onClick: () => void; compact?: boolean;
}) {
  const cfg = STATUS_CAL[r.status] ?? STATUS_CAL.pending;
  return (
    <div onClick={onClick} style={{
      position: "absolute", left: 2, right: 2, top, height,
      background: cfg.bg, color: cfg.text,
      borderLeft: `3px solid ${cfg.dot}`,
      borderRadius: 6, padding: "3px 6px",
      overflow: "hidden", cursor: "pointer", boxSizing: "border-box",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    }}>
      <p style={{margin: 0, fontSize: compact ? 9 : 10, fontWeight: 700, lineHeight: 1.25,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
        {r.time ? r.time.slice(0, 5) + " " : ""}{rClientName(r)}
      </p>
      {height > 38 && (
        <p style={{margin: "1px 0 0", fontSize: 9, opacity: 0.75, lineHeight: 1.2,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
          {rServiceName(r)}
        </p>
      )}
    </div>
  );
}

// ─── ReservationModal ─────────────────────────────────────────────────────────
function ReservationModal({r, onClose, onAction, acting}: {
  r: any;
  onClose: () => void;
  onAction: (id: number, action: "confirm" | "cancel" | "complete") => void;
  acting: number | null;
}) {
  const clientName = rClientName(r);
  const serviceName = rServiceName(r);
  const price = r.totalPrice ?? r.total_price ?? r.service?.price;
  const duration = r.service?.duration ?? r.duration;
  const isBusy = acting === r.id;

  const Row = ({label, value}: {label: string; value: React.ReactNode}) => (
    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 10, borderBottom: `1px solid ${LIGHT}`}}>
      <span style={{fontSize: 12, color: "#64748b", fontWeight: 600, flexShrink: 0, paddingRight: 12}}>{label}</span>
      <span style={{fontSize: 13, color: DARK, fontWeight: 700, textAlign: "right"}}>{value}</span>
    </div>
  );

  return (
    <div
      style={{position: "fixed", inset: 0, zIndex: 200, background: "rgba(18,33,26,0.52)",
        backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
        justifyContent: "center", padding: 20}}
      onClick={onClose}
    >
      <div
        style={{background: "white", borderRadius: 24, maxWidth: 420, width: "100%",
          boxShadow: "0 32px 80px rgba(0,0,0,0.24)", overflow: "hidden", maxHeight: "90vh",
          display: "flex", flexDirection: "column"}}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{background: DARK, padding: "20px 22px", position: "relative", flexShrink: 0}}>
          <button onClick={onClose}
            style={{position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%",
              background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", color: "white"}}>
            <XMarkIcon style={{width: 13, height: 13}} />
          </button>
          <div style={{display: "flex", alignItems: "center", gap: 12}}>
            <div style={{width: 44, height: 44, borderRadius: "50%", background: `rgba(${MAIN_RGB},0.25)`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
              <span style={{color: "white", fontWeight: 900, fontSize: 17}}>{clientName[0]?.toUpperCase()}</span>
            </div>
            <div style={{minWidth: 0}}>
              <p style={{color: "white", fontWeight: 800, fontSize: 16, margin: 0}}>{clientName}</p>
              {r.user?.email && (
                <p style={{color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "2px 0 0",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                  {r.user.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal body */}
        <div style={{padding: "20px 22px", overflowY: "auto", flex: 1}}>
          <div style={{display: "flex", flexDirection: "column", gap: 10}}>
            <Row label="Estado" value={<StatusBadge status={r.status} />} />
            <Row label="Servicio" value={serviceName} />
            {r.date  && <Row label="Fecha"    value={formatDate(r.date)} />}
            {r.time  && <Row label="Hora"     value={r.time.slice(0, 5)} />}
            {duration && <Row label="Duración" value={formatDuration(duration)} />}
            {price != null && (
              <Row label="Precio"
                value={<span style={{color: MAIN, fontWeight: 900, fontSize: 16}}>
                  {typeof price === "number" ? formatCurrency(price) : `$${price}`}
                </span>}
              />
            )}
            {r.notes && (
              <div>
                <p style={{color: "#64748b", fontSize: 12, fontWeight: 600, margin: "0 0 6px"}}>Notas</p>
                <p style={{background: CREAM, borderRadius: 10, padding: "10px 12px", color: DARK, fontSize: 13, margin: 0}}>
                  {r.notes}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {(r.status === "pending" || r.status === "confirmed") && (
            <div style={{display: "flex", gap: 8, marginTop: 20}}>
              {r.status === "pending" && (
                <button onClick={() => onAction(r.id, "confirm")} disabled={isBusy}
                  style={{flex: 1, padding: "12px 0", borderRadius: 12, fontWeight: 800, fontSize: 13, border: `1.5px solid rgba(${MAIN_RGB},0.3)`,
                    background: `rgba(${MAIN_RGB},0.08)`, color: MAIN, cursor: isBusy ? "wait" : "pointer"}}>
                  ✓ Confirmar
                </button>
              )}
              {r.status === "confirmed" && (
                <button onClick={() => onAction(r.id, "complete")} disabled={isBusy}
                  style={{flex: 1, padding: "12px 0", borderRadius: 12, fontWeight: 800, fontSize: 13,
                    border: "1.5px solid rgba(34,93,101,0.25)", background: "rgba(34,93,101,0.08)", color: "#225D65",
                    cursor: isBusy ? "wait" : "pointer"}}>
                  ✓ Completar
                </button>
              )}
              <button onClick={() => onAction(r.id, "cancel")} disabled={isBusy}
                style={{flex: 1, padding: "12px 0", borderRadius: 12, fontWeight: 800, fontSize: 13,
                  border: "1.5px solid rgba(220,38,38,0.2)", background: "rgba(220,38,38,0.06)", color: "#dc2626",
                  cursor: isBusy ? "wait" : "pointer"}}>
                ✕ Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MonthView ────────────────────────────────────────────────────────────────
function MonthView({reservations, currentDate, onSelectDay, onSelectReservation}: {
  reservations: any[];
  currentDate: Date;
  onSelectDay: (d: Date) => void;
  onSelectReservation: (r: any) => void;
}) {
  const matrix = getMonthMatrix(currentDate);
  const today  = new Date();
  const rows   = matrix.length;

  return (
    <div style={{background: "white", borderRadius: 16, border: `1.5px solid ${LIGHT}`, overflow: "hidden"}}>
      {/* Day headers */}
      <div style={{display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: `1px solid ${LIGHT}`}}>
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} style={{padding: "10px 4px", textAlign: "center", fontSize: 10, fontWeight: 700,
            color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em"}}>
            {d}
          </div>
        ))}
      </div>
      {/* Weeks */}
      {matrix.map((week, wi) => (
        <div key={wi} style={{display: "grid", gridTemplateColumns: "repeat(7,1fr)"}}>
          {week.map((day, di) => {
            const borderR = di < 6 ? `1px solid ${LIGHT}` : "none";
            const borderB = wi < rows - 1 ? `1px solid ${LIGHT}` : "none";
            if (!day) {
              return <div key={di} style={{minHeight: 90, background: "rgba(0,0,0,0.018)",
                borderRight: borderR, borderBottom: borderB}} />;
            }
            const dayStr  = day.toISOString().split("T")[0];
            const dayRs   = reservations.filter((r) => rDateStr(r) === dayStr);
            const isToday = isSameDay(day, today);
            const isCurMo = day.getMonth() === currentDate.getMonth();
            return (
              <div key={di} onClick={() => onSelectDay(day)}
                style={{minHeight: 90, padding: "6px 4px", cursor: "pointer",
                  borderRight: borderR, borderBottom: borderB,
                  background: isToday ? `rgba(${MAIN_RGB},0.05)` : "white",
                  transition: "background 0.1s"}}>
                {/* Day number */}
                <div style={{display: "flex", justifyContent: "flex-end", paddingRight: 3, marginBottom: 3}}>
                  <div style={{width: 24, height: 24, borderRadius: "50%", fontSize: 12,
                    background: isToday ? MAIN : "transparent",
                    color: isToday ? "white" : isCurMo ? DARK : "#c0ccc4",
                    fontWeight: isToday ? 900 : isCurMo ? 600 : 400,
                    display: "flex", alignItems: "center", justifyContent: "center"}}>
                    {day.getDate()}
                  </div>
                </div>
                {/* Chips */}
                {dayRs.slice(0, 2).map((r, i) => (
                  <ResChip key={r.id ?? i} r={r}
                    onClick={(e) => { e.stopPropagation(); onSelectReservation(r); }} />
                ))}
                {dayRs.length > 2 && (
                  <p style={{margin: "1px 0 0 2px", fontSize: 9, color: "#94a3b8", fontWeight: 600}}>
                    +{dayRs.length - 2} más
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── WeekView ─────────────────────────────────────────────────────────────────
function WeekView({reservations, currentDate, onSelectReservation}: {
  reservations: any[];
  currentDate: Date;
  onSelectReservation: (r: any) => void;
}) {
  const weekDays = getWeekDays(currentDate);
  const today    = new Date();
  const hours    = Array.from({length: CAL_END_H - CAL_START_H}, (_, i) => i + CAL_START_H);

  return (
    <div style={{background: "white", borderRadius: 16, border: `1.5px solid ${LIGHT}`, overflow: "hidden"}}>
      <div style={{overflowX: "auto", overflowY: "auto", maxHeight: 560}}>
        <div style={{minWidth: 580, display: "flex"}}>
          {/* Time gutter */}
          <div style={{width: 50, flexShrink: 0, borderRight: `1px solid ${LIGHT}`}}>
            <div style={{height: 50, borderBottom: `1px solid ${LIGHT}`}} />
            {hours.map((h) => (
              <div key={h} style={{height: CAL_SLOT_H, display: "flex", alignItems: "flex-start",
                justifyContent: "flex-end", paddingRight: 7, paddingTop: 5, boxSizing: "border-box"}}>
                <span style={{fontSize: 9, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap"}}>
                  {h}:00
                </span>
              </div>
            ))}
          </div>
          {/* Day columns */}
          {weekDays.map((day, di) => {
            const dayStr  = day.toISOString().split("T")[0];
            const dayRs   = reservations.filter((r) => rDateStr(r) === dayStr);
            const isToday = isSameDay(day, today);
            return (
              <div key={di} style={{flex: "1 0 72px", borderLeft: di > 0 ? `1px solid ${LIGHT}` : "none"}}>
                {/* Day header */}
                <div style={{height: 50, display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", borderBottom: `1px solid ${LIGHT}`,
                  background: isToday ? `rgba(${MAIN_RGB},0.04)` : "transparent"}}>
                  <span style={{fontSize: 9, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase"}}>
                    {WEEKDAYS_SHORT[di]}
                  </span>
                  <div style={{width: 26, height: 26, borderRadius: "50%", fontSize: 13, fontWeight: 800, marginTop: 1,
                    background: isToday ? MAIN : "transparent", color: isToday ? "white" : DARK,
                    display: "flex", alignItems: "center", justifyContent: "center"}}>
                    {day.getDate()}
                  </div>
                </div>
                {/* Time slots */}
                <div style={{position: "relative", height: hours.length * CAL_SLOT_H}}>
                  {hours.map((_, idx) => (
                    <div key={idx} style={{position: "absolute", top: idx * CAL_SLOT_H, left: 0, right: 0,
                      borderTop: `1px solid rgba(0,0,0,0.05)`, height: CAL_SLOT_H}} />
                  ))}
                  {dayRs.map((r, i) => {
                    const startMin = timeToMins(r.time ?? "09:00");
                    const dur  = durToMins(r.service?.duration ?? r.duration ?? "01:00:00");
                    const top  = Math.max(0, (startMin - CAL_START_H * 60) / 60 * CAL_SLOT_H);
                    const hgt  = Math.max(28, dur / 60 * CAL_SLOT_H - 2);
                    return <ResBlock key={r.id ?? i} r={r} top={top} height={hgt}
                      onClick={() => onSelectReservation(r)} compact />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── DayView ──────────────────────────────────────────────────────────────────
function DayView({reservations, currentDate, onSelectReservation}: {
  reservations: any[];
  currentDate: Date;
  onSelectReservation: (r: any) => void;
}) {
  const today  = new Date();
  const dayStr = currentDate.toISOString().split("T")[0];
  const dayRs  = reservations.filter((r) => rDateStr(r) === dayStr);
  const isToday= isSameDay(currentDate, today);
  const hours  = Array.from({length: CAL_END_H - CAL_START_H}, (_, i) => i + CAL_START_H);

  return (
    <div style={{background: "white", borderRadius: 16, border: `1.5px solid ${LIGHT}`, overflow: "hidden"}}>
      {/* Day header */}
      <div style={{padding: "16px 20px", borderBottom: `1px solid ${LIGHT}`, display: "flex",
        alignItems: "center", gap: 12, background: isToday ? `rgba(${MAIN_RGB},0.04)` : "transparent"}}>
        <div style={{width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: isToday ? MAIN : `rgba(${MAIN_RGB},0.1)`,
          display: "flex", alignItems: "center", justifyContent: "center"}}>
          <span style={{color: isToday ? "white" : MAIN, fontWeight: 900, fontSize: 18}}>
            {currentDate.getDate()}
          </span>
        </div>
        <div>
          <p style={{color: DARK, fontWeight: 900, fontSize: 16, margin: 0, textTransform: "capitalize"}}>
            {currentDate.toLocaleDateString("es-MX", {weekday:"long", day:"numeric", month:"long"})}
          </p>
          <p style={{color: "#64748b", fontSize: 12, margin: 0}}>
            {dayRs.length} reserva{dayRs.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      {/* Time grid */}
      <div style={{overflowY: "auto", maxHeight: 500}}>
        <div style={{display: "flex"}}>
          {/* Gutter */}
          <div style={{width: 50, flexShrink: 0, borderRight: `1px solid ${LIGHT}`}}>
            {hours.map((h) => (
              <div key={h} style={{height: CAL_SLOT_H, display: "flex", alignItems: "flex-start",
                justifyContent: "flex-end", paddingRight: 7, paddingTop: 5, boxSizing: "border-box"}}>
                <span style={{fontSize: 9, color: "#94a3b8", fontWeight: 600}}>{h}:00</span>
              </div>
            ))}
          </div>
          {/* Events */}
          <div style={{flex: 1, position: "relative", height: hours.length * CAL_SLOT_H}}>
            {hours.map((_, idx) => (
              <div key={idx} style={{position: "absolute", top: idx * CAL_SLOT_H, left: 0, right: 0,
                borderTop: `1px solid rgba(0,0,0,0.05)`, height: CAL_SLOT_H}} />
            ))}
            {dayRs.map((r, i) => {
              const startMin = timeToMins(r.time ?? "09:00");
              const dur  = durToMins(r.service?.duration ?? r.duration ?? "01:00:00");
              const top  = Math.max(0, (startMin - CAL_START_H * 60) / 60 * CAL_SLOT_H);
              const hgt  = Math.max(36, dur / 60 * CAL_SLOT_H - 2);
              return <ResBlock key={r.id ?? i} r={r} top={top} height={hgt}
                onClick={() => onSelectReservation(r)} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ReservationList (list view) ──────────────────────────────────────────────
function ReservationList({reservations, acting, onAction, onSelect}: {
  reservations: any[];
  acting: number | null;
  onAction: (id: number, action: "confirm" | "cancel" | "complete") => void;
  onSelect: (r: any) => void;
}) {
  if (reservations.length === 0) {
    return (
      <div style={{background: "white", borderRadius: 16, border: `1.5px solid ${LIGHT}`}}>
        <EmptyState icon={CalendarDaysIcon} title="Sin reservas"
          description="No hay reservas con los filtros actuales." />
      </div>
    );
  }
  const sorted = [...reservations].sort(
    (a, b) => new Date(b.date ?? b.created_at ?? 0).getTime() - new Date(a.date ?? a.created_at ?? 0).getTime()
  );
  return (
    <div style={{background: "white", borderRadius: 16, border: `1.5px solid ${LIGHT}`, overflow: "hidden"}}>
      {sorted.map((r, i) => {
        const clientName = rClientName(r);
        const isLast = i === sorted.length - 1;
        return (
          <div key={r.id ?? i} onClick={() => onSelect(r)}
            style={{display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
              borderBottom: isLast ? "none" : `1px solid ${LIGHT}`, cursor: "pointer",
              transition: "background 0.1s"}}>
            <div style={{width: 38, height: 38, borderRadius: "50%", background: `rgba(${MAIN_RGB},0.1)`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
              <span style={{color: MAIN, fontWeight: 800, fontSize: 14}}>{clientName[0]?.toUpperCase()}</span>
            </div>
            <div style={{flex: 1, minWidth: 0}}>
              <p style={{color: DARK, fontWeight: 700, fontSize: 14, margin: 0}}>{clientName}</p>
              <p style={{color: "#64748b", fontSize: 12, margin: "2px 0 0"}}>
                {rServiceName(r)}{r.date ? " · " + formatDate(r.date) : ""}{r.time ? " " + r.time.slice(0, 5) : ""}
              </p>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 8, flexShrink: 0}}>
              <StatusBadge status={r.status} />
              {r.status === "pending" && <>
                <ActionBtn onClick={() => onAction(r.id, "confirm")} disabled={acting===r.id}
                  bg={`rgba(${MAIN_RGB},0.1)`} color={MAIN} title="Confirmar">
                  <CheckIcon style={{width: 13, height: 13}} />
                </ActionBtn>
                <ActionBtn onClick={() => onAction(r.id, "cancel")} disabled={acting===r.id}
                  bg="rgba(220,38,38,0.08)" color="#dc2626" title="Cancelar">
                  <XMarkIcon style={{width: 13, height: 13}} />
                </ActionBtn>
              </>}
              {r.status === "confirmed" && <>
                <ActionBtn onClick={() => onAction(r.id, "complete")} disabled={acting===r.id}
                  bg="rgba(34,93,101,0.1)" color="#225D65" title="Completar">
                  <CheckIcon style={{width: 13, height: 13}} />
                </ActionBtn>
                <ActionBtn onClick={() => onAction(r.id, "cancel")} disabled={acting===r.id}
                  bg="rgba(220,38,38,0.08)" color="#dc2626" title="Cancelar">
                  <XMarkIcon style={{width: 13, height: 13}} />
                </ActionBtn>
              </>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section: Reservas ────────────────────────────────────────────────────────
type CalView = "month" | "week" | "day" | "list";

function SectionReservas({
  reservations,
  services,
  isLoading,
  onRefresh,
}: {
  reservations: any[];
  services: any[];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const [calView,        setCalView]        = useState<CalView>("month");
  const [currentDate,    setCurrentDate]    = useState(() => new Date());
  const [showFilters,    setShowFilters]    = useState(false);
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(
    () => new Set(["pending", "confirmed", "completed", "cancelled"])
  );
  const [filterServiceId, setFilterServiceId] = useState("");
  const [filterClient,    setFilterClient]    = useState("");
  const [selectedR,  setSelectedR]  = useState<any>(null);
  const [acting,     setActing]     = useState<number | null>(null);

  // Derive filtered reservations
  const filtered = reservations.filter((r) => {
    if (!filterStatuses.has(r.status)) return false;
    if (filterServiceId && String(r.service?.id ?? r.service) !== filterServiceId) return false;
    if (filterClient && !rClientName(r).toLowerCase().includes(filterClient.toLowerCase())) return false;
    return true;
  });

  const activeFilterCount =
    (filterStatuses.size < 4 ? 4 - filterStatuses.size : 0) +
    (filterServiceId ? 1 : 0) +
    (filterClient ? 1 : 0);

  // Status action handler
  const changeStatus = async (id: number, action: "confirm" | "cancel" | "complete") => {
    setActing(id);
    try {
      if (action === "cancel") await reservationApi.cancelReservation(id);
      else await api.patch(`/reservations/${id}/${action}/`);
      onRefresh();
      setSelectedR(null);
    } catch (err) {
      console.error(err);
    } finally {
      setActing(null);
    }
  };

  // Calendar navigation
  const navigate = (dir: 1 | -1) => {
    setCurrentDate((d) => {
      const next = new Date(d);
      if (calView === "month") next.setMonth(d.getMonth() + dir);
      else if (calView === "week") next.setDate(d.getDate() + dir * 7);
      else next.setDate(d.getDate() + dir);
      return next;
    });
  };

  const periodLabel = () => {
    if (calView === "month")
      return `${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (calView === "week") {
      const days = getWeekDays(currentDate);
      const [f, l] = [days[0], days[6]];
      return f.getMonth() === l.getMonth()
        ? `${f.getDate()} – ${l.getDate()} ${MONTHS_ES[f.getMonth()]} ${f.getFullYear()}`
        : `${f.getDate()} ${MONTHS_ES[f.getMonth()].slice(0, 3)} – ${l.getDate()} ${MONTHS_ES[l.getMonth()].slice(0, 3)} ${l.getFullYear()}`;
    }
    if (calView === "day")
      return currentDate.toLocaleDateString("es-MX", {weekday:"long", day:"numeric", month:"long", year:"numeric"});
    return "Lista";
  };

  const toggleStatus = (s: string) => {
    setFilterStatuses((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const resetFilters = () => {
    setFilterStatuses(new Set(["pending", "confirmed", "completed", "cancelled"]));
    setFilterServiceId("");
    setFilterClient("");
  };

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 16}}>
      <SectionHeader eyebrow="Agenda" title="Reservas" />

      {/* ── Toolbar ── */}
      <div style={{background: "white", borderRadius: 16, border: `1.5px solid ${LIGHT}`,
        padding: "12px 16px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10}}>

        {/* Navigation */}
        <div style={{display: "flex", alignItems: "center", gap: 6}}>
          <button onClick={() => navigate(-1)}
            style={{width: 32, height: 32, borderRadius: 10, border: `1.5px solid ${LIGHT}`,
              background: "white", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", color: DARK}}>
            <ChevronLeftIcon style={{width: 16, height: 16}} />
          </button>
          <button onClick={() => setCurrentDate(new Date())}
            style={{padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${LIGHT}`,
              background: "white", cursor: "pointer", fontSize: 12, fontWeight: 700, color: DARK}}>
            Hoy
          </button>
          <button onClick={() => navigate(1)}
            style={{width: 32, height: 32, borderRadius: 10, border: `1.5px solid ${LIGHT}`,
              background: "white", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", color: DARK}}>
            <ChevronRightIcon style={{width: 16, height: 16}} />
          </button>
          <span style={{color: DARK, fontWeight: 800, fontSize: 14, marginLeft: 4, minWidth: 160,
            textTransform: "capitalize"}}>
            {periodLabel()}
          </span>
        </div>

        <div style={{flex: 1}} />

        {/* View switcher */}
        <div style={{display: "flex", background: CREAM, borderRadius: 10, padding: 3, gap: 2}}>
          {(["month", "week", "day", "list"] as CalView[]).map((v) => (
            <button key={v} onClick={() => setCalView(v)} style={{
              padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 700, transition: "all 0.15s",
              background: calView === v ? "white" : "transparent",
              color: calView === v ? DARK : "#64748b",
              boxShadow: calView === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
              {({month:"Mes", week:"Semana", day:"Día", list:"Lista"} as Record<CalView,string>)[v]}
            </button>
          ))}
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters((f) => !f)}
          style={{display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
            borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
            border: `1.5px solid ${showFilters || activeFilterCount > 0 ? `rgba(${MAIN_RGB},0.45)` : LIGHT}`,
            background: showFilters ? `rgba(${MAIN_RGB},0.07)` : "white",
            color: showFilters ? MAIN : "#64748b"}}>
          <AdjustmentsHorizontalIcon style={{width: 15, height: 15}} />
          Filtros
          {activeFilterCount > 0 && (
            <span style={{width: 18, height: 18, borderRadius: "50%", background: MAIN, color: "white",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800}}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filters panel ── */}
      {showFilters && (
        <div style={{background: "white", borderRadius: 16, border: `1.5px solid rgba(${MAIN_RGB},0.3)`,
          padding: "18px 20px"}}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            {/* Status */}
            <div>
              <p style={{color: DARK, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
                textTransform: "uppercase", margin: "0 0 10px"}}>Estado</p>
              <div style={{display: "flex", flexDirection: "column", gap: 7}}>
                {(["pending","confirmed","completed","cancelled"] as const).map((s) => {
                  const cal = STATUS_CAL[s];
                  return (
                    <label key={s} style={{display: "flex", alignItems: "center", gap: 8, cursor: "pointer"}}>
                      <input type="checkbox" checked={filterStatuses.has(s)} onChange={() => toggleStatus(s)}
                        style={{width: 14, height: 14, accentColor: MAIN, cursor: "pointer"}} />
                      <div style={{width: 8, height: 8, borderRadius: "50%", background: cal.dot, flexShrink: 0}} />
                      <span style={{fontSize: 13, color: DARK, fontWeight: 500}}>
                        {STATUS_CFG[s]?.label ?? s}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Service */}
            <div>
              <p style={{color: DARK, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
                textTransform: "uppercase", margin: "0 0 10px"}}>Servicio</p>
              <select value={filterServiceId} onChange={(e) => setFilterServiceId(e.target.value)}
                style={{width: "100%", background: CREAM, border: `1.5px solid ${LIGHT}`, borderRadius: 10,
                  color: DARK, fontSize: 13, padding: "9px 12px", outline: "none",
                  cursor: "pointer", fontFamily: "inherit", fontWeight: 500}}>
                <option value="">Todos los servicios</option>
                {services.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Client search */}
            <div>
              <p style={{color: DARK, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
                textTransform: "uppercase", margin: "0 0 10px"}}>Cliente</p>
              <div style={{position: "relative"}}>
                <MagnifyingGlassIcon style={{width: 13, height: 13, color: "#94a3b8",
                  position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)"}} />
                <input type="text" placeholder="Buscar por nombre…" value={filterClient}
                  onChange={(e) => setFilterClient(e.target.value)}
                  style={{width: "100%", background: CREAM, border: `1.5px solid ${LIGHT}`, borderRadius: 10,
                    color: DARK, fontSize: 13, padding: "9px 12px 9px 32px", outline: "none",
                    boxSizing: "border-box", fontFamily: "inherit", fontWeight: 500}} />
              </div>
              {filterClient && (
                <button onClick={() => setFilterClient("")}
                  style={{marginTop: 5, fontSize: 11, color: "#64748b", background: "none",
                    border: "none", cursor: "pointer", padding: 0, fontWeight: 600}}>
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Reset link */}
          {activeFilterCount > 0 && (
            <div style={{marginTop: 14, paddingTop: 12, borderTop: `1px solid ${LIGHT}`}}>
              <button onClick={resetFilters}
                style={{fontSize: 12, color: "#64748b", background: "none", border: "none",
                  cursor: "pointer", fontWeight: 600, padding: 0}}>
                Restablecer todos los filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Stats strip ── */}
      <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
        {[
          {label:"Total",       count: filtered.length,                                              dot: DARK},
          {label:"Pendientes",  count: filtered.filter((r)=>r.status==="pending").length,   dot: "#f59e0b"},
          {label:"Confirmadas", count: filtered.filter((r)=>r.status==="confirmed").length, dot: MAIN},
          {label:"Completadas", count: filtered.filter((r)=>r.status==="completed").length, dot: "#10b981"},
          {label:"Canceladas",  count: filtered.filter((r)=>r.status==="cancelled").length, dot: "#94a3b8"},
        ].map((s) => (
          <div key={s.label}
            style={{display: "flex", alignItems: "center", gap: 5, background: "white",
              borderRadius: 10, padding: "5px 12px", border: `1.5px solid ${LIGHT}`}}>
            <span style={{width: 7, height: 7, borderRadius: "50%", background: s.dot, display: "inline-block"}} />
            <span style={{fontSize: 11, color: "#64748b"}}>{s.label}</span>
            <span style={{fontSize: 12, fontWeight: 800, color: DARK}}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* ── Calendar content ── */}
      {isLoading ? (
        <Skeleton h={440} radius={16} />
      ) : (
        <>
          {calView === "month" && (
            <MonthView
              reservations={filtered}
              currentDate={currentDate}
              onSelectDay={(d) => { setCurrentDate(d); setCalView("day"); }}
              onSelectReservation={setSelectedR}
            />
          )}
          {calView === "week" && (
            <WeekView reservations={filtered} currentDate={currentDate} onSelectReservation={setSelectedR} />
          )}
          {calView === "day" && (
            <DayView reservations={filtered} currentDate={currentDate} onSelectReservation={setSelectedR} />
          )}
          {calView === "list" && (
            <ReservationList reservations={filtered} acting={acting} onAction={changeStatus} onSelect={setSelectedR} />
          )}
        </>
      )}

      {/* ── Detail modal ── */}
      {selectedR && (
        <ReservationModal r={selectedR} onClose={() => setSelectedR(null)} onAction={changeStatus} acting={acting} />
      )}
    </div>
  );
}

// ─── Section: Servicios ──────────────────────────────────────────────────────
function SectionServicios({
  services,
  isLoading,
  onRefresh,
}: {
  services: any[];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const [toggling, setToggling] = useState<number | null>(null);

  const toggleService = async (id: number) => {
    setToggling(id);
    try {
      await serviceApi.toggleActive(id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(null);
    }
  };

  const ctaLink = (
    <Link
      href="/profile"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: ACCENT,
        color: INK,
        borderRadius: 12,
        padding: "10px 18px",
        fontWeight: 800,
        fontSize: 13,
        textDecoration: "none",
      }}
    >
      <PlusIcon style={{width: 14, height: 14}} />
      Nuevo servicio
    </Link>
  );

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 20}}>
      <SectionHeader eyebrow="Tu catálogo" title="Servicios" action={services.length > 0 ? ctaLink : undefined} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} h={210} radius={20} />)}
        </div>
      ) : services.length === 0 ? (
        <div style={{background: "white", borderRadius: 20, border: `1.5px solid ${LIGHT}`}}>
          <EmptyState
            icon={BriefcaseIcon}
            title="Sin servicios aún"
            description="Agrega tus servicios para que los clientes puedan reservar."
            action={
              <Link
                href="/profile"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: MAIN,
                  color: "white",
                  borderRadius: 12,
                  padding: "10px 20px",
                  fontWeight: 800,
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                <PlusIcon style={{width: 14, height: 14}} />
                Crear primer servicio
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s: any, i: number) => (
            <ServiceCard
              key={s.id ?? i}
              service={s}
              onToggle={() => toggleService(s.id)}
              toggling={toggling === s.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  service: s,
  onToggle,
  toggling,
}: {
  service: any;
  onToggle: () => void;
  toggling: boolean;
}) {
  const isActive = s.is_active !== false;
  const img = s.images?.[0];

  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        border: `1.5px solid ${isActive ? LIGHT : "#e5e7eb"}`,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        opacity: isActive ? 1 : 0.72,
        transition: "opacity 0.2s",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Cover */}
      <div
        style={{
          height: 120,
          flexShrink: 0,
          background: img
            ? `url(${img}) center/cover`
            : `linear-gradient(135deg,rgba(${MAIN_RGB},0.12),rgba(${MAIN_RGB},0.05))`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!img && <BriefcaseIcon style={{width: 36, height: 36, color: `rgba(${MAIN_RGB},0.35)`}} />}
        {/* Toggle */}
        <button
          onClick={onToggle}
          disabled={toggling}
          title={isActive ? "Desactivar" : "Activar"}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: isActive ? MAIN : "#e5e7eb",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            opacity: toggling ? 0.5 : 1,
          }}
        >
          {isActive ? (
            <EyeIcon style={{width: 14, height: 14, color: "white"}} />
          ) : (
            <EyeSlashIcon style={{width: 14, height: 14, color: "#64748b"}} />
          )}
        </button>
        {/* Category badge */}
        {s.category && (
          <span
            style={{
              position: "absolute",
              bottom: 8,
              left: 10,
              background: "rgba(0,0,0,0.48)",
              color: "white",
              borderRadius: 999,
              padding: "2px 8px",
              fontSize: 10,
              fontWeight: 700,
              backdropFilter: "blur(4px)",
            }}
          >
            {s.category}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 6}}>
        <p style={{color: DARK, fontWeight: 800, fontSize: 15, margin: 0, lineHeight: 1.3}}>
          {s.name}
        </p>
        {s.description && (
          <p
            style={{
              color: "#64748b",
              fontSize: 12,
              margin: 0,
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {s.description}
          </p>
        )}
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto"}}>
          <div>
            <span style={{color: MAIN, fontWeight: 900, fontSize: 18}}>
              {typeof s.price === "number" ? formatCurrency(s.price) : `$${s.price}`}
            </span>
            {s.duration && (
              <div style={{display: "flex", alignItems: "center", gap: 3, marginTop: 2}}>
                <ClockIcon style={{width: 11, height: 11, color: "#94a3b8"}} />
                <span style={{color: "#94a3b8", fontSize: 11}}>{formatDuration(s.duration)}</span>
              </div>
            )}
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 999,
              background: isActive ? `rgba(${MAIN_RGB},0.1)` : "#f1f5f9",
              color: isActive ? LABEL : "#94a3b8",
            }}
          >
            {isActive ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Ventas ──────────────────────────────────────────────────────────
const CURRENCIES = ["MXN", "USD", "COP", "EUR"] as const;
type Currency = (typeof CURRENCIES)[number];

const CURRENCY_SYMBOLS: Record<Currency, string> = {MXN: "$", USD: "$", COP: "$", EUR: "€"};

const STATUS_VENTA: Record<string, {label: string; bg: string; color: string}> = {
  DRAFT:          {label: "Borrador",     bg: "rgba(100,116,139,0.1)",  color: "#475569"},
  PAID:           {label: "Pagado",       bg: `rgba(${MAIN_RGB},0.12)`, color: LABEL},
  PARTIALLY_PAID: {label: "Pago parcial", bg: "rgba(245,158,11,0.12)", color: "#b45309"},
  CANCELLED:      {label: "Cancelado",    bg: "rgba(220,38,38,0.08)",   color: "#dc2626"},
  REFUNDED:       {label: "Reembolsado",  bg: "rgba(139,92,246,0.1)",   color: "#7c3aed"},
};

function fmtMoney(amount: number | string, currency: string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const sym = CURRENCY_SYMBOLS[currency as Currency] ?? "$";
  return `${sym}${num.toFixed(2)} ${currency}`;
}

interface SaleItem {
  item_type: "SERVICE" | "PRODUCT";
  service_ref?: number | null;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

function NuevaVentaModal({
  open,
  onClose,
  services,
  reservations,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  services: any[];
  reservations: any[];
  onCreated: () => void;
}) {
  const [step, setStep] = useState<"items" | "payment">("items");
  const [currency, setCurrency]     = useState<Currency>("MXN");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [reservationId, setReservationId] = useState<number | "">("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax]         = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Prefill from reservation
  useEffect(() => {
    if (!reservationId) return;
    const res = reservations.find((r: any) => r.id === reservationId);
    if (!res) return;
    const clientN = res.client_name ?? res.client?.first_name ?? "";
    setClientName(clientN);
    setClientEmail(res.client?.email ?? "");
    // Auto-add service as item
    if (res.service) {
      const svc = services.find((s: any) => s.id === res.service?.id || s.id === res.service);
      if (svc) {
        setItems([{
          item_type: "SERVICE",
          service_ref: svc.id,
          name: svc.name,
          quantity: 1,
          unit_price: parseFloat(svc.price) || 0,
          discount: 0,
          total: parseFloat(svc.price) || 0,
        }]);
      }
    }
  }, [reservationId, reservations, services]);

  const subtotal = items.reduce((acc, i) => acc + i.total, 0);
  const total    = Math.max(subtotal - discount + tax, 0);
  const change   = Math.max(amountPaid - total, 0);

  const addServiceItem = (svc: any) => {
    setItems((prev) => [
      ...prev,
      {
        item_type: "SERVICE",
        service_ref: svc.id,
        name: svc.name,
        quantity: 1,
        unit_price: parseFloat(svc.price) || 0,
        discount: 0,
        total: parseFloat(svc.price) || 0,
      },
    ]);
  };

  const addManualItem = () => {
    setItems((prev) => [
      ...prev,
      {item_type: "PRODUCT", service_ref: null, name: "", quantity: 1, unit_price: 0, discount: 0, total: 0},
    ]);
  };

  const updateItem = (idx: number, patch: Partial<SaleItem>) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const next = {...item, ...patch};
        next.total = Math.max(next.unit_price * next.quantity - next.discount, 0);
        return next;
      })
    );
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSaveAndPay = async () => {
    if (items.length === 0) { setError("Agrega al menos un servicio o producto."); return; }
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        currency,
        client_name: clientName || null,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        reservation: reservationId || null,
        discount,
        tax,
        notes: notes || null,
        items: items.map((it) => ({
          item_type: it.item_type,
          service_ref: it.service_ref ?? null,
          name: it.name,
          description: it.description ?? null,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount: it.discount,
        })),
      };
      const res = await ventasApi.createSale(payload);
      const saleId = res.data.id;
      // Mark as paid immediately
      await ventasApi.markPaid(saleId, {amount_paid: amountPaid || total, payment_method: paymentMethod});
      onCreated();
      handleClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar la venta.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (items.length === 0) { setError("Agrega al menos un servicio o producto."); return; }
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        currency,
        client_name: clientName || null,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        reservation: reservationId || null,
        discount,
        tax,
        notes: notes || null,
        items: items.map((it) => ({
          item_type: it.item_type,
          service_ref: it.service_ref ?? null,
          name: it.name,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount: it.discount,
        })),
      };
      await ventasApi.createSale(payload);
      onCreated();
      handleClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el borrador.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setStep("items");
    setClientName(""); setClientEmail(""); setClientPhone("");
    setReservationId(""); setItems([]);
    setDiscount(0); setTax(0);
    setPaymentMethod("CASH"); setAmountPaid(0); setNotes("");
    setError(null);
    onClose();
  };

  if (!open) return null;

  const inputS: React.CSSProperties = {
    width: "100%", background: CREAM, border: `1.5px solid ${LIGHT}`,
    borderRadius: 10, color: DARK, fontSize: 13, fontWeight: 500,
    padding: "9px 12px", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };
  const labelS: React.CSSProperties = {
    display: "block", color: DARK, fontSize: 11, fontWeight: 700,
    marginBottom: 5, letterSpacing: "0.04em", textTransform: "uppercase",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(18,33,26,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        style={{
          background: "white", borderRadius: "24px 24px 0 0",
          width: "100%", maxWidth: 680, maxHeight: "92vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.18)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 24px 16px", borderBottom: `1px solid ${LIGHT}`, flexShrink: 0,
          }}
        >
          <div>
            <p style={{color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px"}}>
              {step === "items" ? "Registro de venta" : "Cobro"}
            </p>
            <h2 style={{color: DARK, fontWeight: 900, fontSize: 18, margin: 0}}>
              {step === "items" ? "Nueva venta" : `Total: ${fmtMoney(total, currency)}`}
            </h2>
          </div>
          <div style={{display: "flex", alignItems: "center", gap: 10}}>
            {/* Currency */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              style={{...inputS, width: "auto", padding: "7px 10px"}}
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={handleClose} style={{background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8"}}>
              <XMarkIcon style={{width: 22, height: 22}} />
            </button>
          </div>
        </div>

        {/* Steps indicator */}
        <div style={{display: "flex", padding: "10px 24px", gap: 8, flexShrink: 0}}>
          {(["items", "payment"] as const).map((s, i) => (
            <div
              key={s}
              onClick={() => { if (s === "payment" && items.length === 0) return; setStep(s); }}
              style={{
                flex: 1, height: 3, borderRadius: 999, cursor: "pointer",
                background: step === s ? ACCENT : (
                  (s === "payment" && step === "payment") ? ACCENT : LIGHT
                ),
              }}
            />
          ))}
        </div>

        {/* Body */}
        <div style={{flex: 1, overflowY: "auto", padding: "12px 24px 24px"}}>
          {error && (
            <div style={{background: "rgba(220,38,38,0.08)", border: "1.5px solid rgba(220,38,38,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14}}>
              <p style={{color: "#dc2626", fontSize: 13, fontWeight: 600, margin: 0}}>{error}</p>
            </div>
          )}

          {step === "items" && (
            <div style={{display: "flex", flexDirection: "column", gap: 18}}>
              {/* Client + Reservation row */}
              <div style={{background: CREAM, borderRadius: 14, padding: "16px 18px", border: `1.5px solid ${LIGHT}`}}>
                <p style={{color: DARK, fontWeight: 800, fontSize: 13, margin: "0 0 12px"}}>Información del cliente</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label style={labelS}>Nombre</label>
                    <input style={inputS} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre del cliente" />
                  </div>
                  <div>
                    <label style={labelS}>Reserva vinculada</label>
                    <select style={inputS} value={reservationId} onChange={(e) => setReservationId(e.target.value ? Number(e.target.value) : "")}>
                      <option value="">Sin reserva</option>
                      {reservations.filter((r: any) => !["CANCELLED"].includes(r.status?.toUpperCase())).map((r: any) => (
                        <option key={r.id} value={r.id}>
                          #{r.id} – {r.service?.name ?? "Servicio"} · {r.date ?? ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelS}>Email</label>
                    <input style={inputS} type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="email@ejemplo.com" />
                  </div>
                  <div>
                    <label style={labelS}>Teléfono</label>
                    <input style={inputS} value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+52 55 0000 0000" />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10}}>
                  <p style={{color: DARK, fontWeight: 800, fontSize: 13, margin: 0}}>Servicios y productos</p>
                  <button
                    onClick={addManualItem}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: "transparent", border: `1.5px solid ${LIGHT}`,
                      borderRadius: 10, padding: "6px 12px", cursor: "pointer",
                      color: DARK, fontSize: 12, fontWeight: 700,
                    }}
                  >
                    <PlusIcon style={{width: 13, height: 13}} />
                    Producto manual
                  </button>
                </div>

                {/* Quick-add from my services */}
                {services.filter((s: any) => s.is_active !== false).length > 0 && (
                  <div style={{marginBottom: 12}}>
                    <p style={{...labelS, marginBottom: 8}}>Agregar servicio existente</p>
                    <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
                      {services.filter((s: any) => s.is_active !== false).map((svc: any) => (
                        <button
                          key={svc.id}
                          onClick={() => addServiceItem(svc)}
                          style={{
                            background: `rgba(${MAIN_RGB},0.08)`,
                            border: `1.5px solid rgba(${MAIN_RGB},0.2)`,
                            borderRadius: 10, padding: "6px 12px",
                            color: LABEL, fontSize: 12, fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          + {svc.name} · {fmtMoney(svc.price, currency)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {items.length === 0 ? (
                  <div style={{background: CREAM, borderRadius: 12, padding: "24px", textAlign: "center", border: `1.5px dashed ${LIGHT}`}}>
                    <BriefcaseIcon style={{width: 28, height: 28, color: `rgba(${MAIN_RGB},0.3)`, margin: "0 auto 8px"}} />
                    <p style={{color: "#94a3b8", fontSize: 13, margin: 0}}>Agrega servicios o productos</p>
                  </div>
                ) : (
                  <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                    {/* Header row */}
                    <div className="hidden sm:grid" style={{gridTemplateColumns: "1fr 70px 100px 80px 80px 28px", gap: 6, padding: "0 8px"}}>
                      {["Descripción","Cant.","P. Unitario","Descuento","Total",""].map((h, i) => (
                        <span key={i} style={{color: "#94a3b8", fontSize: 10, fontWeight: 700, textTransform: "uppercase"}}>{h}</span>
                      ))}
                    </div>
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_70px_100px_80px_80px_28px]"
                        style={{gap: 6, background: CREAM, borderRadius: 12, padding: "10px 12px", border: `1.5px solid ${LIGHT}`, alignItems: "center"}}
                      >
                        <div>
                          <input
                            style={{...inputS, fontSize: 13}}
                            value={item.name}
                            onChange={(e) => updateItem(idx, {name: e.target.value})}
                            placeholder="Nombre del ítem"
                          />
                        </div>
                        <input
                          type="number" min={1} style={inputS}
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, {quantity: parseInt(e.target.value) || 1})}
                        />
                        <input
                          type="number" min={0} step={0.01} style={inputS}
                          value={item.unit_price}
                          onChange={(e) => updateItem(idx, {unit_price: parseFloat(e.target.value) || 0})}
                          placeholder="Precio"
                        />
                        <input
                          type="number" min={0} step={0.01} style={inputS}
                          value={item.discount}
                          onChange={(e) => updateItem(idx, {discount: parseFloat(e.target.value) || 0})}
                          placeholder="Desc."
                        />
                        <span style={{color: MAIN, fontWeight: 800, fontSize: 14, textAlign: "right"}}>
                          {CURRENCY_SYMBOLS[currency]}{item.total.toFixed(2)}
                        </span>
                        <button onClick={() => removeItem(idx)} style={{background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", display: "flex"}}>
                          <TrashIcon style={{width: 16, height: 16}} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div style={{background: CREAM, borderRadius: 14, padding: "16px 18px", border: `1.5px solid ${LIGHT}`}}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{marginBottom: 12}}>
                  <div>
                    <label style={labelS}>Descuento global ({currency})</label>
                    <input type="number" min={0} step={0.01} style={inputS} value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label style={labelS}>Impuestos ({currency})</label>
                    <input type="number" min={0} step={0.01} style={inputS} value={tax} onChange={(e) => setTax(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label style={labelS}>Notas</label>
                    <input style={inputS} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas internas…" />
                  </div>
                </div>
                <div style={{display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end"}}>
                  <span style={{color: "#94a3b8", fontSize: 12}}>Subtotal: {fmtMoney(subtotal, currency)}</span>
                  {discount > 0 && <span style={{color: "#94a3b8", fontSize: 12}}>Descuento: -{fmtMoney(discount, currency)}</span>}
                  {tax > 0 && <span style={{color: "#94a3b8", fontSize: 12}}>Impuestos: +{fmtMoney(tax, currency)}</span>}
                  <span style={{color: DARK, fontWeight: 900, fontSize: 20}}>Total: {fmtMoney(total, currency)}</span>
                </div>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div style={{display: "flex", flexDirection: "column", gap: 18}}>
              <div style={{background: CREAM, borderRadius: 14, padding: "20px 18px", border: `1.5px solid ${LIGHT}`, textAlign: "center"}}>
                <p style={{color: "#94a3b8", fontSize: 12, margin: "0 0 6px"}}>Total a cobrar</p>
                <p style={{color: DARK, fontWeight: 900, fontSize: 32, margin: "0 0 4px"}}>{fmtMoney(total, currency)}</p>
                {clientName && <p style={{color: "#64748b", fontSize: 13, margin: 0}}>Cliente: {clientName}</p>}
              </div>

              <div>
                <label style={labelS}>Método de pago</label>
                <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
                  {[["CASH","💵 Efectivo"],["CARD","💳 Tarjeta"],["TRANSFER","🏦 Transferencia"],["OTHER","Otro"]].map(([val, lbl]) => (
                    <button
                      key={val}
                      onClick={() => setPaymentMethod(val)}
                      style={{
                        flex: 1, minWidth: 100, padding: "12px 8px",
                        borderRadius: 12, border: `2px solid ${paymentMethod === val ? MAIN : LIGHT}`,
                        background: paymentMethod === val ? `rgba(${MAIN_RGB},0.08)` : "white",
                        color: paymentMethod === val ? LABEL : "#64748b",
                        fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "CASH" && (
                <>
                  <div>
                    <label style={labelS}>Monto recibido ({currency})</label>
                    <input
                      type="number" min={0} step={0.01} style={{...inputS, fontSize: 20, fontWeight: 900, textAlign: "right"}}
                      value={amountPaid || ""}
                      onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                      placeholder={total.toFixed(2)}
                    />
                  </div>
                  {amountPaid > 0 && (
                    <div style={{background: change > 0 ? `rgba(${MAIN_RGB},0.08)` : "rgba(220,38,38,0.06)", borderRadius: 12, padding: "14px 18px", border: `1.5px solid ${change > 0 ? `rgba(${MAIN_RGB},0.2)` : "rgba(220,38,38,0.15)"}`}}>
                      <p style={{margin: 0, color: change > 0 ? LABEL : "#dc2626", fontWeight: 800, fontSize: 16}}>
                        {change > 0 ? `Cambio: ${fmtMoney(change, currency)}` : `Falta: ${fmtMoney(Math.abs(amountPaid - total), currency)}`}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: "14px 24px 20px", borderTop: `1px solid ${LIGHT}`,
            display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap",
          }}
        >
          {step === "items" ? (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                style={{
                  flex: 1, padding: "13px", borderRadius: 12, border: `1.5px solid ${LIGHT}`,
                  background: "white", color: DARK, fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}
              >
                Guardar borrador
              </button>
              <button
                onClick={() => { if (items.length === 0) { setError("Agrega al menos un ítem."); return; } setError(null); setStep("payment"); }}
                style={{
                  flex: 2, padding: "13px", borderRadius: 12, border: "none",
                  background: ACCENT, color: INK, fontWeight: 800, fontSize: 14, cursor: "pointer",
                }}
              >
                Continuar al cobro →
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep("items")}
                style={{
                  flex: 1, padding: "13px", borderRadius: 12, border: `1.5px solid ${LIGHT}`,
                  background: "white", color: DARK, fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}
              >
                ← Volver
              </button>
              <button
                onClick={handleSaveAndPay}
                disabled={saving}
                style={{
                  flex: 2, padding: "13px", borderRadius: 12, border: "none",
                  background: MAIN, color: "white", fontWeight: 800, fontSize: 14,
                  cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {saving ? <ArrowPathIcon style={{width: 18, height: 18, animation: "spin 1s linear infinite"}} /> : <BanknotesIcon style={{width: 18, height: 18}} />}
                {saving ? "Procesando…" : "Confirmar cobro"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SaleRow({sale, onMarkPaid, onCancel}: {sale: any; onMarkPaid: (id: number) => void; onCancel: (id: number) => void}) {
  const cfg = STATUS_VENTA[sale.status] ?? {label: sale.status, bg: "#f1f5f9", color: "#64748b"};
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto auto auto",
        gap: 12, alignItems: "center",
        background: "white", borderRadius: 14,
        border: `1.5px solid ${LIGHT}`, padding: "12px 16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
      }}
      className="grid-cols-[auto_1fr_auto_auto_auto]"
    >
      {/* Sale number */}
      <div>
        <p style={{color: "#94a3b8", fontSize: 10, fontWeight: 700, margin: "0 0 1px", textTransform: "uppercase"}}>{sale.sale_number}</p>
        <p style={{color: "#94a3b8", fontSize: 10, margin: 0}}>
          {new Date(sale.created_at).toLocaleDateString("es-MX", {day: "2-digit", month: "short", year: "numeric"})}
        </p>
      </div>
      {/* Client + items */}
      <div>
        <p style={{color: DARK, fontWeight: 700, fontSize: 14, margin: "0 0 2px"}}>{sale.client_name || "Sin nombre"}</p>
        <p style={{color: "#94a3b8", fontSize: 11, margin: 0}}>{sale.item_count} ítem{sale.item_count !== 1 ? "s" : ""} · {sale.payment_method ?? "–"}</p>
      </div>
      {/* Total */}
      <p style={{color: MAIN, fontWeight: 900, fontSize: 16, margin: 0, whiteSpace: "nowrap"}}>
        {fmtMoney(sale.total, sale.currency)}
      </p>
      {/* Status badge */}
      <span style={{background: cfg.bg, color: cfg.color, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap"}}>
        {cfg.label}
      </span>
      {/* Actions */}
      <div style={{display: "flex", gap: 6}}>
        {sale.status === "DRAFT" && (
          <button
            onClick={() => onMarkPaid(sale.id)}
            title="Marcar como pagado"
            style={{background: `rgba(${MAIN_RGB},0.1)`, border: "none", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: LABEL}}
          >
            <CheckIcon style={{width: 14, height: 14}} />
          </button>
        )}
        {["DRAFT","PARTIALLY_PAID"].includes(sale.status) && (
          <button
            onClick={() => onCancel(sale.id)}
            title="Cancelar"
            style={{background: "rgba(220,38,38,0.08)", border: "none", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: "#dc2626"}}
          >
            <XMarkIcon style={{width: 14, height: 14}} />
          </button>
        )}
      </div>
    </div>
  );
}

function SectionVentas({
  sales,
  stats,
  services,
  reservations,
  isLoading,
  onRefresh,
}: {
  sales: any[];
  stats: any;
  services: any[];
  reservations: any[];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const filtered = sales.filter((s) => {
    const matchSearch = !search || (s.client_name ?? "").toLowerCase().includes(search.toLowerCase()) || s.sale_number.includes(search);
    const matchStatus = !filterStatus || s.status === filterStatus;
    const matchCurrency = !filterCurrency || s.currency === filterCurrency;
    return matchSearch && matchStatus && matchCurrency;
  });

  const handleMarkPaid = async (id: number) => {
    setActionLoading(id);
    try {
      await ventasApi.markPaid(id, {payment_method: "CASH"});
      onRefresh();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("¿Cancelar esta venta?")) return;
    setActionLoading(id);
    try {
      await ventasApi.cancel(id);
      onRefresh();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const kpiStyle = (accent: string): React.CSSProperties => ({
    background: "white", borderRadius: 18, padding: "18px 20px",
    border: `1.5px solid ${LIGHT}`, boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
  });

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 20}}>
      <SectionHeader
        eyebrow="Cobranza"
        title="Ventas"
        action={
          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: ACCENT, color: INK, borderRadius: 12,
              padding: "10px 18px", fontWeight: 800, fontSize: 13, border: "none", cursor: "pointer",
            }}
          >
            <PlusIcon style={{width: 14, height: 14}} />
            Nueva venta
          </button>
        }
      />

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map((i) => <Skeleton key={i} h={90} radius={18} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div style={kpiStyle(MAIN)}>
            <p style={{color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px"}}>Ventas totales</p>
            <p style={{color: DARK, fontWeight: 900, fontSize: 26, margin: "0 0 2px"}}>{stats?.total_sales ?? sales.length}</p>
            <p style={{color: "#94a3b8", fontSize: 11, margin: 0}}>registros</p>
          </div>
          <div style={kpiStyle(MAIN)}>
            <p style={{color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px"}}>Cobrado total</p>
            <p style={{color: MAIN, fontWeight: 900, fontSize: 22, margin: "0 0 2px"}}>
              ${parseFloat(stats?.paid_revenue ?? 0).toFixed(0)}
            </p>
            <p style={{color: "#94a3b8", fontSize: 11, margin: 0}}>ventas pagadas</p>
          </div>
          <div style={kpiStyle(MAIN)}>
            <p style={{color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px"}}>Pendiente</p>
            <p style={{color: "#b45309", fontWeight: 900, fontSize: 22, margin: "0 0 2px"}}>
              ${parseFloat(stats?.pending_revenue ?? 0).toFixed(0)}
            </p>
            <p style={{color: "#94a3b8", fontSize: 11, margin: 0}}>por cobrar</p>
          </div>
          <div style={kpiStyle(MAIN)}>
            <p style={{color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px"}}>Cobrado hoy</p>
            <p style={{color: ACCENT, fontWeight: 900, fontSize: 22, margin: "0 0 2px"}}>
              ${parseFloat(stats?.today_revenue ?? 0).toFixed(0)}
            </p>
            <p style={{color: "#94a3b8", fontSize: 11, margin: 0}}>MXN hoy</p>
          </div>
        </div>
      )}

      {/* By currency summary */}
      {stats?.by_currency && Object.keys(stats.by_currency).length > 0 && (
        <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
          {Object.entries(stats.by_currency).map(([cur, amt]) => (
            <div key={cur} style={{background: "white", border: `1.5px solid ${LIGHT}`, borderRadius: 12, padding: "8px 16px", display: "flex", gap: 8, alignItems: "center"}}>
              <ReceiptPercentIcon style={{width: 14, height: 14, color: MAIN}} />
              <span style={{color: DARK, fontWeight: 800, fontSize: 13}}>{fmtMoney(parseFloat(amt as string), cur)}</span>
              <span style={{color: "#94a3b8", fontSize: 11}}>cobrado</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters + Search */}
      <div style={{display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center"}}>
        <div style={{position: "relative", flex: 1, minWidth: 180}}>
          <MagnifyingGlassIcon style={{position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8"}} />
          <input
            style={{width: "100%", background: "white", border: `1.5px solid ${LIGHT}`, borderRadius: 10, padding: "9px 12px 9px 32px", fontSize: 13, color: DARK, fontWeight: 500, outline: "none", boxSizing: "border-box"}}
            placeholder="Buscar por cliente o número…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{background: "white", border: `1.5px solid ${LIGHT}`, borderRadius: 10, padding: "9px 12px", fontSize: 13, color: DARK, fontWeight: 500, outline: "none"}}
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_VENTA).map(([val, {label}]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          value={filterCurrency}
          onChange={(e) => setFilterCurrency(e.target.value)}
          style={{background: "white", border: `1.5px solid ${LIGHT}`, borderRadius: 10, padding: "9px 12px", fontSize: 13, color: DARK, fontWeight: 500, outline: "none"}}
        >
          <option value="">Todas las monedas</option>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Sales list */}
      {isLoading ? (
        <div style={{display: "flex", flexDirection: "column", gap: 8}}>
          {[0,1,2,3].map((i) => <Skeleton key={i} h={68} radius={14} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{background: "white", borderRadius: 20, border: `1.5px solid ${LIGHT}`}}>
          <EmptyState
            icon={BanknotesIcon}
            title={sales.length === 0 ? "Sin ventas registradas" : "Sin resultados"}
            description={sales.length === 0 ? "Registra tu primera venta para comenzar a llevar el control de tu cobranza." : "Ajusta los filtros para ver más resultados."}
            action={sales.length === 0 ? (
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: MAIN, color: "white", borderRadius: 12,
                  padding: "10px 20px", fontWeight: 800, fontSize: 13, border: "none", cursor: "pointer",
                }}
              >
                <PlusIcon style={{width: 14, height: 14}} />
                Registrar primera venta
              </button>
            ) : undefined}
          />
        </div>
      ) : (
        <div style={{display: "flex", flexDirection: "column", gap: 8}}>
          {filtered.map((sale) => (
            <SaleRow
              key={sale.id}
              sale={sale}
              onMarkPaid={handleMarkPaid}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      <NuevaVentaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        services={services}
        reservations={reservations}
        onCreated={() => { onRefresh(); setModalOpen(false); }}
      />
    </div>
  );
}

// ─── Section: Galería ─────────────────────────────────────────────────────────
function SectionGaleria({
  profile,
  services,
  isLoading,
  onRefresh,
}: {
  profile: any;
  services: any[];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const profileImages: string[] = profile?.images ?? [];
  const serviceImages = services.flatMap((s: any) =>
    (s.images ?? []).map((url: string) => ({url, label: s.name}))
  );
  const allImages = [
    ...profileImages.map((url) => ({url, label: "Perfil"})),
    ...serviceImages,
  ];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    setUploading(true);
    try {
      await publicProfileApi.uploadImage(profile.id, file);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const uploadBtn = profile?.id ? (
    <>
      <input ref={fileRef} type="file" accept="image/*" style={{display: "none"}} onChange={handleUpload} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: ACCENT,
          color: INK,
          borderRadius: 12,
          padding: "10px 18px",
          fontWeight: 800,
          fontSize: 13,
          border: "none",
          cursor: uploading ? "wait" : "pointer",
          opacity: uploading ? 0.6 : 1,
        }}
      >
        {uploading ? (
          <ArrowPathIcon style={{width: 14, height: 14, animation: "spin 1s linear infinite"}} />
        ) : (
          <PlusIcon style={{width: 14, height: 14}} />
        )}
        Subir foto
      </button>
    </>
  ) : undefined;

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 20}}>
      <SectionHeader eyebrow="Portafolio" title="Mi galería" action={allImages.length > 0 ? uploadBtn : undefined} />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} h={160} radius={16} />)}
        </div>
      ) : allImages.length === 0 ? (
        <div style={{background: "white", borderRadius: 20, border: `1.5px solid ${LIGHT}`}}>
          <EmptyState
            icon={PhotoIcon}
            title="Sin fotos aún"
            description="Agrega fotos a tu perfil y servicios para atraer más clientes."
            action={uploadBtn}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {allImages.map((img, i) => (
            <div
              key={i}
              style={{
                borderRadius: 16,
                overflow: "hidden",
                position: "relative",
                paddingTop: "100%",
                background: LIGHT,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.label}
                style={{position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover"}}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "linear-gradient(transparent,rgba(0,0,0,0.5))",
                  padding: "16px 8px 6px",
                  textAlign: "center",
                }}
              >
                <span style={{color: "white", fontSize: 10, fontWeight: 700}}>{img.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section: Perfil ──────────────────────────────────────────────────────────
function SectionPerfil({
  profile,
  user,
  isLoading,
  onRefresh,
}: {
  profile: any;
  user: any;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setForm({
        name:        profile.name ?? "",
        description: profile.description ?? "",
        bio:         profile.bio ?? "",
        category:    profile.category ?? "",
        city:        profile.city ?? "",
        country:     profile.country ?? "",
      });
    }
  }, [profile]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({...p, [key]: e.target.value}));

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      await publicProfileApi.updatePublicProfile(profile.id, form);
      setSaved(true);
      onRefresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const rating = profile?.rating ?? 0;
  const fullStars = Math.floor(rating);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: CREAM,
    border: `1.5px solid ${LIGHT}`,
    borderRadius: 12,
    color: DARK,
    fontSize: 14,
    fontWeight: 500,
    padding: "11px 14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 20}}>
      <SectionHeader eyebrow="Configuración" title="Mi perfil" />

      {isLoading ? (
        <div style={{display: "flex", flexDirection: "column", gap: 14}}>
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} h={56} radius={14} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          {/* Profile card */}
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: "28px 24px",
              border: `1.5px solid ${LIGHT}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            {/* Avatar */}
            {profile?.user_image ?? user?.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile?.user_image ?? user?.profilePicture}
                alt="avatar"
                style={{width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: `3px solid ${LIGHT}`}}
              />
            ) : (
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  background: `rgba(${MAIN_RGB},0.12)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `3px solid ${LIGHT}`,
                }}
              >
                <UserCircleIcon style={{width: 50, height: 50, color: MAIN}} />
              </div>
            )}

            {/* Name + type */}
            <div style={{textAlign: "center"}}>
              <p style={{color: DARK, fontWeight: 900, fontSize: 18, margin: "0 0 6px", lineHeight: 1.2}}>
                {profile?.display_name ?? profile?.name ?? `${user?.firstName} ${user?.lastName}`}
              </p>
              {profile?.profile_type && (
                <span
                  style={{
                    background: `rgba(${MAIN_RGB},0.1)`,
                    color: LABEL,
                    borderRadius: 999,
                    padding: "3px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {profile.profile_type === "PROFESSIONAL" ? "Profesional" : "Establecimiento"}
                </span>
              )}
            </div>

            {/* Stars */}
            {rating > 0 && (
              <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 4}}>
                <div style={{display: "flex", gap: 3}}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <StarIcon
                      key={n}
                      style={{width: 18, height: 18, color: n <= fullStars ? ACCENT : "#e5e7eb"}}
                    />
                  ))}
                </div>
                <span style={{color: "#64748b", fontSize: 12}}>{rating.toFixed(1)} / 5</span>
              </div>
            )}

            {/* Location */}
            {profile?.city && (
              <p style={{color: "#64748b", fontSize: 12, textAlign: "center", margin: 0}}>
                {profile.city}{profile.country ? `, ${profile.country}` : ""}
              </p>
            )}

            {/* Email row */}
            <div style={{width: "100%", borderTop: `1px solid ${LIGHT}`, paddingTop: 14}}>
              <p style={{color: "#94a3b8", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 3px"}}>
                Correo
              </p>
              <p style={{color: DARK, fontSize: 13, fontWeight: 600, margin: 0, wordBreak: "break-all"}}>
                {user?.email}
              </p>
            </div>

            {/* Role */}
            {user?.role && (
              <div style={{width: "100%"}}>
                <p style={{color: "#94a3b8", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 3px"}}>
                  Rol
                </p>
                <p style={{color: DARK, fontSize: 13, fontWeight: 600, margin: 0}}>
                  {user.role}
                </p>
              </div>
            )}
          </div>

          {/* Edit form */}
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: "28px 26px",
              border: `1.5px solid ${LIGHT}`,
            }}
          >
            <p style={{color: DARK, fontWeight: 800, fontSize: 16, margin: "0 0 20px"}}>
              Editar información
            </p>

            {!profile?.id && (
              <div
                style={{
                  background: `rgba(${MAIN_RGB},0.07)`,
                  border: `1.5px solid rgba(${MAIN_RGB},0.25)`,
                  borderRadius: 12,
                  padding: "12px 16px",
                  marginBottom: 16,
                }}
              >
                <p style={{color: LABEL, fontSize: 13, fontWeight: 600, margin: 0}}>
                  Aún no tienes un perfil público. Créalo desde la sección de perfil.
                </p>
              </div>
            )}

            <div style={{display: "flex", flexDirection: "column", gap: 14}}>
              <div>
                <label style={{display: "block", color: DARK, fontSize: 12, fontWeight: 700, marginBottom: 6}}>
                  Nombre del negocio / perfil
                </label>
                <input value={form.name ?? ""} onChange={set("name")} style={inputStyle} placeholder="Nombre de tu perfil" />
              </div>

              <div>
                <label style={{display: "block", color: DARK, fontSize: 12, fontWeight: 700, marginBottom: 6}}>
                  Descripción
                </label>
                <textarea
                  value={form.description ?? ""}
                  onChange={set("description")}
                  rows={3}
                  style={{...inputStyle, resize: "vertical"}}
                  placeholder="Cuéntales a tus clientes sobre ti y tus servicios…"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={{display: "block", color: DARK, fontSize: 12, fontWeight: 700, marginBottom: 6}}>
                    Categoría
                  </label>
                  <input value={form.category ?? ""} onChange={set("category")} style={inputStyle} placeholder="Belleza, Spa, Yoga…" />
                </div>
                <div>
                  <label style={{display: "block", color: DARK, fontSize: 12, fontWeight: 700, marginBottom: 6}}>
                    Ciudad
                  </label>
                  <input value={form.city ?? ""} onChange={set("city")} style={inputStyle} placeholder="Ciudad" />
                </div>
              </div>

              <div>
                <label style={{display: "block", color: DARK, fontSize: 12, fontWeight: 700, marginBottom: 6}}>
                  País
                </label>
                <input value={form.country ?? ""} onChange={set("country")} style={inputStyle} placeholder="País" />
              </div>

              <div style={{display: "flex", alignItems: "center", gap: 14, marginTop: 6}}>
                <button
                  onClick={handleSave}
                  disabled={saving || !profile?.id}
                  style={{
                    background: ACCENT,
                    color: INK,
                    borderRadius: 12,
                    padding: "12px 26px",
                    fontWeight: 800,
                    fontSize: 14,
                    border: "none",
                    cursor: saving || !profile?.id ? "not-allowed" : "pointer",
                    opacity: saving || !profile?.id ? 0.6 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {saving ? "Guardando…" : "Guardar cambios"}
                </button>
                {saved && (
                  <span style={{color: MAIN, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 5}}>
                    <CheckIcon style={{width: 14, height: 14}} />
                    Guardado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Nav items config ─────────────────────────────────────────────────────────
const NAV_ITEMS: {id: Section; label: string; icon: React.ComponentType<{style?: React.CSSProperties}>}[] = [
  {id: "resumen",   label: "Resumen",   icon: HomeIcon},
  {id: "reservas",  label: "Reservas",  icon: CalendarDaysIcon},
  {id: "servicios", label: "Servicios", icon: BriefcaseIcon},
  {id: "ventas",    label: "Ventas",    icon: BanknotesIcon},
  {id: "galeria",   label: "Galería",   icon: PhotoIcon},
  {id: "perfil",    label: "Mi perfil", icon: UserCircleIcon},
];

// ─── Client wall (role = "client") ───────────────────────────────────────────
function ClientWall({onLogout}: {onLogout: () => void}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: "var(--font-geist-sans)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 28,
          border: `1.5px solid ${LIGHT}`,
          boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
          maxWidth: 480,
          width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Top accent bar */}
        <div style={{height: 5, background: `linear-gradient(90deg, ${MAIN}, ${ACCENT})`}} />

        <div style={{padding: "40px 36px 36px", textAlign: "center"}}>
          {/* Logo */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "#1F3328",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}

          >
            <img
              src="/nabbi_logo_t.png"
              alt="nabbi logo"
              style={{width: 32, height: 32}}
            />
          </div>

          {/* Icon */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: `rgba(${MAIN_RGB},0.1)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={MAIN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
            </svg>
          </div>

          <h1
            style={{
              color: INK,
              fontWeight: 900,
              fontSize: 22,
              margin: "0 0 10px",
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
            }}
          >
            Este panel es solo para profesionales
          </h1>

          <p style={{color: "#64748b", fontSize: 15, lineHeight: 1.65, margin: "0 0 8px"}}>
            El dashboard de <strong style={{color: DARK}}>nabbi</strong> está diseñado para
            profesionales y establecimientos que gestionan sus servicios y reservas.
          </p>
          <p style={{color: "#64748b", fontSize: 15, lineHeight: 1.65, margin: "0 0 28px"}}>
            Como cliente, puedes reservar citas y explorar servicios desde la{" "}
            <strong style={{color: DARK}}>app móvil de nabbi</strong> disponible en tu dispositivo.
          </p>

          {/* App store badges row */}
          <div style={{display: "flex", gap: 10, justifyContent: "center", marginBottom: 28, flexWrap: "wrap"}}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                background: INK,
                color: "white",
                borderRadius: 12,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              App Store
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                background: INK,
                color: "white",
                borderRadius: 12,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.76c.3.17.65.19.96.04l12.45-6.99-2.78-2.79-10.63 9.74zM.54 1.03C.2 1.4 0 1.96 0 2.67v18.67c0 .71.2 1.27.55 1.64l.09.08 10.46-10.46v-.25L.63.95l-.09.08zM20.12 9.8l-2.98-1.67-3.12 3.12 3.12 3.12 3-1.68c.85-.48.85-1.27-.02-1.89zM3.18.24L15.63 7.2l-2.78 2.79L2.22.25c.3-.15.66-.13.96-.01z"/>
              </svg>
              Google Play
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            style={{
              background: "transparent",
              border: `1.5px solid ${LIGHT}`,
              borderRadius: 12,
              color: "#94a3b8",
              fontSize: 13,
              fontWeight: 600,
              padding: "10px 22px",
              cursor: "pointer",
              width: "100%",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#dc2626";
              (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = LIGHT;
              (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard shell ─────────────────────────────────────────────────────────
function DashboardApp() {
  const {user, logout} = useAuth();
  const [section, setSection] = useState<Section>("resumen");
  const [services, setServices]         = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [reviews, setReviews]           = useState<any[]>([]);
  const [profile, setProfile]           = useState<any>(null);
  const [sales, setSales]               = useState<any[]>([]);
  const [salesStats, setSalesStats]     = useState<any>(null);
  const [isLoading, setIsLoading]       = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [sRes, rRes, revRes, pRes, ventasRes, statsRes] = await Promise.allSettled([
      serviceApi.getMyServices(),
      reservationApi.getReservations(),
      reviewApi.getReviews(),
      publicProfileApi.getMyProfile(),
      ventasApi.getSales(),
      ventasApi.getStats(),
    ]);
    if (sRes.status === "fulfilled") {
      const d = sRes.value.data;
      setServices(Array.isArray(d) ? d : (d?.results ?? []));
    }
    if (rRes.status === "fulfilled") {
      const d = rRes.value.data;
      setReservations(Array.isArray(d) ? d : (d?.results ?? []));
    }
    if (revRes.status === "fulfilled") {
      const d = revRes.value.data;
      setReviews(Array.isArray(d) ? d : (d?.results ?? []));
    }
    if (pRes.status === "fulfilled") setProfile(pRes.value.data);
    if (ventasRes.status === "fulfilled") {
      const d = ventasRes.value.data;
      setSales(Array.isArray(d) ? d : (d?.results ?? []));
    }
    if (statsRes.status === "fulfilled") setSalesStats(statsRes.value.data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user?.role !== "client") loadData();
  }, [loadData, user?.role]);

  // Block clients — dashboard is for professionals and places only
  if (user?.role === "client") {
    return <ClientWall onLogout={logout} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: "var(--font-geist-sans)",
        display: "flex",
      }}
    >
      {/* ── Sidebar (desktop) ── */}
      <aside
        className="hidden lg:flex flex-col"
        style={{
          width: 228,
          flexShrink: 0,
          background: DARK,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div style={{padding: "22px 18px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)"}}>
          <Link href="/" style={{display: "flex", alignItems: "center", gap: 9, textDecoration: "none"}}>
            <img
              src="/nabbi_logo_t.png"
              alt="nabbi logo"
              style={{width: 34, height: 34, borderRadius: 11}}
            />
            <span style={{color: "white", fontWeight: 900, fontSize: 20, letterSpacing: "-0.03em"}}>nabbi</span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2}}>
          {NAV_ITEMS.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 13px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  background: active ? `rgba(${MAIN_RGB},0.2)` : "transparent",
                  color: active ? "white" : "rgba(255,255,255,0.5)",
                  fontWeight: active ? 700 : 500,
                  fontSize: 14,
                  textAlign: "left",
                  width: "100%",
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                <item.icon style={{width: 18, height: 18, flexShrink: 0}} />
                {item.label}
                {active && (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: ACCENT,
                      marginLeft: "auto",
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{padding: "14px 12px", borderTop: "1px solid rgba(255,255,255,0.07)"}}>
          <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 10}}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: `rgba(${MAIN_RGB},0.25)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{color: "white", fontWeight: 800, fontSize: 13}}>
                {user?.firstName?.[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
            <div style={{minWidth: 0}}>
              <p style={{color: "white", fontWeight: 700, fontSize: 13, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                {user?.firstName} {user?.lastName}
              </p>
              <p style={{color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 12px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.55)",
              fontSize: 13,
              fontWeight: 600,
              transition: "background 0.15s",
            }}
          >
            <ArrowRightOnRectangleIcon style={{width: 16, height: 16}} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{flex: 1, display: "flex", flexDirection: "column", minWidth: 0}}>
        {/* Top bar */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            background: "rgba(250,248,243,0.96)",
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${LIGHT}`,
            boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "0 20px",
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            {/* Left: mobile logo + section title */}
            <div style={{display: "flex", alignItems: "center", gap: 10}}>
              <Link href="/" className="lg:hidden" style={{display: "flex", alignItems: "center", gap: 6, textDecoration: "none"}}>
                <span style={{fontWeight: 900, fontSize: 18, color: DARK, letterSpacing: "-0.03em"}}>nabbi</span>
              </Link>
              <span className="hidden lg:block" style={{color: DARK, fontWeight: 800, fontSize: 17}}>
                {NAV_ITEMS.find((n) => n.id === section)?.label}
              </span>
            </div>

            {/* Right */}
            <div style={{display: "flex", alignItems: "center", gap: 8}}>
              {/* Refresh */}
              <button
                onClick={loadData}
                disabled={isLoading}
                title="Actualizar datos"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: `1.5px solid ${LIGHT}`,
                  background: "white",
                  cursor: isLoading ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: LABEL,
                }}
              >
                <ArrowPathIcon
                  style={{
                    width: 16,
                    height: 16,
                    animation: isLoading ? "spin 1s linear infinite" : "none",
                  }}
                />
              </button>

              {/* User chip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 12px",
                  background: "white",
                  borderRadius: 999,
                  border: `1.5px solid ${LIGHT}`,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: `rgba(${MAIN_RGB},0.12)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{color: MAIN, fontWeight: 800, fontSize: 11}}>
                    {user?.firstName?.[0]?.toUpperCase()}
                  </span>
                </div>
                <span
                  style={{
                    color: DARK,
                    fontSize: 13,
                    fontWeight: 700,
                    maxWidth: 110,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.firstName}
                </span>
              </div>

              {/* Logout (desktop) */}
              <button
                onClick={logout}
                className="hidden md:flex"
                title="Cerrar sesión"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: `1.5px solid ${LIGHT}`,
                  background: "white",
                  cursor: "pointer",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                }}
              >
                <ArrowRightOnRectangleIcon style={{width: 16, height: 16}} />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main
          style={{
            flex: 1,
            maxWidth: 1200,
            width: "100%",
            margin: "0 auto",
            padding: "24px 20px 100px",
            boxSizing: "border-box",
          }}
        >
          {section === "resumen" && (
            <SectionResumen services={services} reservations={reservations} reviews={reviews} isLoading={isLoading} />
          )}
          {section === "reservas" && (
            <SectionReservas reservations={reservations} services={services} isLoading={isLoading} onRefresh={loadData} />
          )}
          {section === "servicios" && (
            <SectionServicios services={services} isLoading={isLoading} onRefresh={loadData} />
          )}
          {section === "ventas" && (
            <SectionVentas sales={sales} stats={salesStats} services={services} reservations={reservations} isLoading={isLoading} onRefresh={loadData} />
          )}
          {section === "galeria" && (
            <SectionGaleria profile={profile} services={services} isLoading={isLoading} onRefresh={loadData} />
          )}
          {section === "perfil" && (
            <SectionPerfil profile={profile} user={user} isLoading={isLoading} onRefresh={loadData} />
          )}
        </main>

        {/* ── Bottom nav (mobile) ── */}
        <nav
          className="lg:hidden"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: DARK,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            padding: "8px 0",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "6px 4px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: active ? "white" : "rgba(255,255,255,0.38)",
                  transition: "color 0.15s",
                  position: "relative",
                }}
              >
                <item.icon style={{width: 20, height: 20}} />
                <span style={{fontSize: 9, fontWeight: 700}}>{item.label.split(" ")[0]}</span>
                {active && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 24,
                      height: 2,
                      borderRadius: "0 0 4px 4px",
                      background: ACCENT,
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardApp />
    </ProtectedRoute>
  );
}
