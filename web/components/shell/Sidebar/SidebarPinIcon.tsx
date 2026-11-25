/**
 * Push-pin glyph for the sidebar pin control.
 * Heroicons has no push-pin (MapPin = location only — not used).
 * Phosphor / Lucide / Tabler are not installed → clean inline SVG
 * (Lucide Pin path language). 24×24, currentColor, stroke 1.75 / fill.
 */
type Props = {
  /** Filled (pinned) vs outline (unpinned). */
  pinned?: boolean;
  size?: number;
  className?: string;
};

export function SidebarPinIcon({
  pinned = false,
  size = 20,
  className = "",
}: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24" as const,
    "aria-hidden": true as const,
    focusable: false as const,
    className: `shrink-0 ${className}`,
    style: {shapeRendering: "geometricPrecision" as const},
  };

  if (pinned) {
    return (
      <svg {...common} fill="currentColor">
        {/* Head + collar */}
        <path d="M16 3a2 2 0 0 1 .15 3.99L16 7a1 1 0 0 0-1 1v2.76a2 2 0 0 0 1.11 1.79l1.78.9A2 2 0 0 1 19 15.24V16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-.76a2 2 0 0 1 1.11-1.79l1.78-.9A2 2 0 0 0 9 10.76V8a1 1 0 0 0-1-1 2 2 0 1 1 0-4z" />
        {/* Shaft */}
        <rect x="11" y="17" width="2" height="5" rx="1" />
      </svg>
    );
  }

  return (
    <svg
      {...common}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </svg>
  );
}
