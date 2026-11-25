/** Spanish relative + absolute time helpers (es-MX). */

const LOCALE = "es-MX";

export function absoluteTimeLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat(LOCALE, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Short absolute date for list rows older than 4 weeks (e.g. "28 jul 2026"). */
export function shortDateLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat(LOCALE, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const FOUR_WEEKS_SEC = 86400 * 28;

/**
 * Relative time up to 4 weeks; then short absolute date.
 * Pass the relative string via Tooltip when showing the absolute form.
 */
export function relativeTimeLabel(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.round((then - now) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(LOCALE, {numeric: "auto"});

  if (abs < 60) return rtf.format(Math.round(diffSec / 1), "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 7) return rtf.format(Math.round(diffSec / 86400), "day");
  if (abs < FOUR_WEEKS_SEC) {
    return rtf.format(Math.round(diffSec / (86400 * 7)), "week");
  }
  return shortDateLabel(iso);
}

/** True when the list should show shortDate + relative in Tooltip. */
export function isOlderThanFourWeeks(iso: string, now = Date.now()): boolean {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return false;
  return Math.abs(then - now) / 1000 >= FOUR_WEEKS_SEC;
}

export type DateGroupKey = "hoy" | "ayer" | "semana" | "anteriores";

export const DATE_GROUP_LABEL: Record<DateGroupKey, string> = {
  hoy: "Hoy",
  ayer: "Ayer",
  semana: "Esta semana",
  anteriores: "Anteriores",
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function dateGroupKey(iso: string, now = new Date()): DateGroupKey {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "anteriores";
  const today = startOfDay(now);
  const that = startOfDay(d);
  const diffDays = Math.round(
    (today.getTime() - that.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "ayer";
  if (diffDays > 1 && diffDays < 7) return "semana";
  return "anteriores";
}

export function groupByDate<T extends {createdAt: string}>(
  items: T[],
): {key: DateGroupKey; label: string; items: T[]}[] {
  const order: DateGroupKey[] = ["hoy", "ayer", "semana", "anteriores"];
  const buckets: Record<DateGroupKey, T[]> = {
    hoy: [],
    ayer: [],
    semana: [],
    anteriores: [],
  };
  const now = new Date();
  for (const item of items) {
    buckets[dateGroupKey(item.createdAt, now)].push(item);
  }
  return order
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({key: k, label: DATE_GROUP_LABEL[k], items: buckets[k]}));
}
