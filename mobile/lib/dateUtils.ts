export function parseISODateAsLocal(dateStr: string): Date {
  // If backend sends a plain YYYY-MM-DD, JS Date parses it as UTC which can shift the day.
  // Parse it as a local date instead.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }
  return new Date(dateStr);
}

export function formatDateToYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


