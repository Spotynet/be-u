const ROOT_ID = "overlay-root";

/**
 * Single portal host for shell overlays. Created once; StrictMode-safe.
 */
export function getOverlayRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let el = document.getElementById(ROOT_ID);
  if (el) return el;
  el = document.createElement("div");
  el.id = ROOT_ID;
  el.setAttribute("data-nabbi-overlay-root", "1");
  document.body.appendChild(el);
  return el;
}

export {ROOT_ID as OVERLAY_ROOT_ID};
