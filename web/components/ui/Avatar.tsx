"use client";

import Image from "next/image";

const SIZE = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-10 w-10 text-sm",
  xl: "h-12 w-12 text-base",
} as const;

/**
 * Deterministic soft token backgrounds for auto fallback.
 * Only brand tokens that exist in the theme — never bare initials
 * without a visible circle (avoid undefined `bg-muted` / `bg-destructive`).
 */
const TOKEN_BG = [
  "bg-primary/15 text-primary",
  "bg-secondary/80 text-secondary-foreground",
  "bg-primary-light text-primary-dark",
  "bg-accent/20 text-accent",
  "bg-foreground-muted/15 text-foreground-secondary",
] as const;

export type AvatarSize = keyof typeof SIZE;

export type AvatarProps = {
  src?: string | null;
  alt?: string;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
  /**
   * `auto` — soft token bg + foreground initials.
   * `cta` — yellow CTA bg + dark CTA-text initials (readable on dark frame).
   */
  fallbackTone?: "auto" | "cta";
  /** Extra classes on the outer ring wrapper (default: ring-card). */
  ringClassName?: string;
};

function initials(name?: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toneIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % 997;
  return h % TOKEN_BG.length;
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Avatar({
  src,
  alt,
  name,
  size = "md",
  className,
  fallbackTone = "auto",
  ringClassName,
}: AvatarProps) {
  const label = alt || name || "Usuario";
  const letters = initials(name);
  const bg =
    fallbackTone === "cta"
      ? "bg-secondary text-secondary-foreground"
      : TOKEN_BG[toneIndex(name || letters)];

  return (
    <span
      className={cx(
        "relative inline-flex shrink-0 overflow-hidden rounded-full ring-2",
        ringClassName ?? "ring-card",
        SIZE[size],
        className,
      )}
      aria-label={label}
      role="img"
    >
      {src ? (
        <Image src={src} alt={label} fill className="object-cover" sizes="48px" />
      ) : (
        <span
          className={cx(
            "flex h-full w-full items-center justify-center font-semibold tracking-wide",
            bg,
          )}
          aria-hidden
        >
          {letters}
        </span>
      )}
    </span>
  );
}

export type AvatarGroupProps = {
  people: Array<{src?: string | null; name?: string | null}>;
  max?: number;
  size?: AvatarSize;
  className?: string;
};

export function AvatarGroup({
  people,
  max = 4,
  size = "sm",
  className,
}: AvatarGroupProps) {
  const shown = people.slice(0, max);
  const rest = Math.max(0, people.length - max);
  return (
    <div className={cx("flex items-center -space-x-2", className)} role="group">
      {shown.map((p, i) => (
        <Avatar
          key={`${p.name || "u"}-${i}`}
          src={p.src}
          name={p.name}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {rest > 0 ? (
        <span
          className={cx(
            "relative inline-flex shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground ring-2 ring-background",
            SIZE[size],
          )}
          aria-label={`+${rest} más`}>
          +{rest}
        </span>
      ) : null}
    </div>
  );
}
