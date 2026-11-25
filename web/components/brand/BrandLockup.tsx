import Link from "next/link";

export type BrandLockupVariant = "full" | "mark";
export type BrandLockupSize = "sm" | "md" | "lg";
/** Surface behind the lockup — picks `/logo/{white|default}/` rasters. */
export type BrandLockupTone = "on-dark" | "on-light";

type Props = {
  variant?: BrandLockupVariant;
  size?: BrandLockupSize;
  tone?: BrandLockupTone;
  /** Home link. Pass `null` to render a non-interactive span. */
  href?: string | null;
  className?: string;
};

/** Asset folder: white mark on dark frame; default brand on light. */
function folderForTone(tone: BrandLockupTone): "white" | "default" {
  return tone === "on-dark" ? "white" : "default";
}

function asset(tone: BrandLockupTone, part: "icon" | "text") {
  return `/logo/${folderForTone(tone)}/${part}.png`;
}

/** Pre-scale bases (px). Visible size = round(base * --brand-scale). */
const MARK_BASE: Record<BrandLockupSize, number> = {
  sm: 26,
  md: 32,
  lg: 40,
};

const WORD_BASE: Record<BrandLockupSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

/** Match CSS `--brand-scale: 0.85` (keep JS heights in sync for img attributes). */
const BRAND_SCALE = 0.85;

function scaled(base: number): number {
  return Math.round(base * BRAND_SCALE);
}

/**
 * Official nabbi lockup — bare mark + wordmark, no tile / fixed-width slot.
 * Gap between glyph edges: `--brand-gap` (5px). Sizes via `--brand-scale`.
 */
export function BrandLockup({
  variant = "full",
  size = "md",
  tone = "on-light",
  href = "/",
  className = "",
}: Props) {
  const markH = scaled(MARK_BASE[size]);
  const wordH = scaled(WORD_BASE[size]);

  const inner = (
    <span
      className="nabbi-brand-lockup__inner"
      role="img"
      aria-label="nabbi">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="nabbi-brand-lockup__mark"
        src={asset(tone, "icon")}
        alt=""
        aria-hidden
        height={markH}
        style={{height: markH, width: "auto"}}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="nabbi-brand-lockup__word"
        src={asset(tone, "text")}
        alt=""
        aria-hidden
        height={wordH}
        style={{height: wordH, width: "auto"}}
      />
    </span>
  );

  const cls = [
    "nabbi-brand-lockup",
    `nabbi-brand-lockup--${size}`,
    `nabbi-brand-lockup--${tone}`,
    variant === "mark" ? "nabbi-brand-lockup--mark-only" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link
        href={href}
        className={`${cls} nabbi-brand-lockup--link`.trim()}
        aria-label="nabbi, ir al inicio">
        {inner}
      </Link>
    );
  }

  return <span className={cls}>{inner}</span>;
}
