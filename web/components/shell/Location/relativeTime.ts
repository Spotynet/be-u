/** Spanish relative time for location freshness. */
export function formatRelativeEs(ts: number | null | undefined): string {
  if (ts == null) return "";
  const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (sec < 45) return "Actualizada ahora";
  if (sec < 3600) {
    const m = Math.round(sec / 60);
    return m === 1 ? "Actualizada hace 1 min" : `Actualizada hace ${m} min`;
  }
  if (sec < 86400) {
    const h = Math.round(sec / 3600);
    return h === 1 ? "Actualizada hace 1 h" : `Actualizada hace ${h} h`;
  }
  const d = Math.round(sec / 86400);
  return d === 1 ? "Actualizada hace 1 día" : `Actualizada hace ${d} días`;
}

export function sourceLabel(
  source: "gps" | "manual" | "profile" | "none",
): string {
  if (source === "gps") return "Detectada con tu dispositivo";
  if (source === "manual") return "Elegida por ti";
  if (source === "profile") return "De tu perfil";
  return "";
}
