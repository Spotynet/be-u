/**
 * HTML OverlayView markers for Explorar.
 * Avoids AdvancedMarkerElement (requires mapId, which disables JSON styles).
 */

export type OverlayKind = "pin" | "cluster" | "user";

export type HtmlOverlayOpts = {
  maps: any;
  map: any;
  position: {lat: number; lng: number};
  className: string;
  html: string;
  zIndex?: number;
  title?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export class HtmlMapOverlay {
  private overlay: any;
  private div: HTMLDivElement | null = null;
  private position: {lat: number; lng: number};
  private opts: HtmlOverlayOpts;

  constructor(opts: HtmlOverlayOpts) {
    this.opts = opts;
    this.position = opts.position;
    const maps = opts.maps;
    const self = this;

    class Impl extends maps.OverlayView {
      onAdd() {
        const el = document.createElement("div");
        el.className = opts.className;
        el.innerHTML = opts.html;
        el.style.position = "absolute";
        el.style.pointerEvents = "auto";
        el.style.willChange = "transform";
        if (opts.title) el.title = opts.title;
        el.setAttribute("role", "button");
        el.tabIndex = 0;
        if (opts.onClick) {
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            opts.onClick?.();
          });
          el.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              opts.onClick?.();
            }
          });
        }
        if (opts.onMouseEnter) {
          el.addEventListener("mouseenter", () => opts.onMouseEnter?.());
        }
        if (opts.onMouseLeave) {
          el.addEventListener("mouseleave", () => opts.onMouseLeave?.());
        }
        self.div = el;
        const panes = this.getPanes();
        panes?.overlayMouseTarget?.appendChild(el);
      }

      draw() {
        if (!self.div) return;
        const proj = this.getProjection();
        if (!proj) return;
        const pt = proj.fromLatLngToDivPixel(
          new maps.LatLng(self.position.lat, self.position.lng),
        );
        if (!pt) return;
        self.div.style.left = `${pt.x}px`;
        self.div.style.top = `${pt.y}px`;
        if (opts.zIndex != null) self.div.style.zIndex = String(opts.zIndex);
      }

      onRemove() {
        self.div?.remove();
        self.div = null;
      }
    }

    this.overlay = new Impl();
    this.overlay.setMap(opts.map);
  }

  setPosition(pos: {lat: number; lng: number}) {
    this.position = pos;
    this.overlay.draw?.();
  }

  setContent(html: string, className?: string) {
    if (!this.div) return;
    this.div.innerHTML = html;
    if (className) this.div.className = className;
  }

  setZIndex(z: number) {
    if (this.div) this.div.style.zIndex = String(z);
  }

  setMap(map: any | null) {
    this.overlay.setMap(map);
  }

  getElement() {
    return this.div;
  }
}

export function warnIfMapIdWithStyles(mapOpts: Record<string, unknown>) {
  if (
    process.env.NODE_ENV === "development" &&
    mapOpts.mapId &&
    mapOpts.styles
  ) {
    console.warn(
      "[explore] styles are ignored when mapId is set — remove mapId to use JSON styles.",
    );
  }
}
