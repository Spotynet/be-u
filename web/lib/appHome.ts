/**
 * Hybrid home: desktop/tablet → explore (marketplace), mobile → feed (social).
 */
export function getAppHomePath(): string {
  if (typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches) {
    return "/explore";
  }
  return "/feed";
}
