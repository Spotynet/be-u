import {
  BrandLockup,
  type BrandLockupSize,
  type BrandLockupTone,
  type BrandLockupVariant,
} from "./BrandLockup";

type LegacyVariant = "header" | "auth-panel" | "auth-mobile";
/** @deprecated Prefer `BrandLockupTone`. */
export type LogoTone = "default" | "white" | "black" | "negative";
/** @deprecated Prefer `BrandLockupVariant`. */
export type LogoMark = "lockup" | "icon" | "word";

type Props = {
  variant?: LegacyVariant;
  href?: string | null;
  className?: string;
  /** Legacy tone folders — mapped to on-dark / on-light. */
  tone?: LogoTone;
  mark?: LogoMark;
};

function mapTone(tone?: LogoTone): BrandLockupTone {
  if (tone === "white" || tone === "negative") return "on-dark";
  if (tone === "default" || tone === "black") return "on-light";
  return "on-light";
}

function mapMark(mark?: LogoMark): BrandLockupVariant {
  return mark === "icon" || mark === "word" ? "mark" : "full";
}

function mapSize(variant: LegacyVariant): BrandLockupSize {
  if (variant === "auth-panel") return "lg";
  if (variant === "auth-mobile") return "sm";
  return "md";
}

/**
 * Back-compat wrapper around {@link BrandLockup}.
 * New call sites should import `BrandLockup` directly.
 */
export function NabbiLogo({
  variant = "header",
  href = "/",
  className = "",
  tone,
  mark = "lockup",
}: Props) {
  /* Auth variants keep legacy layout hooks via className on BrandLockup. */
  if (variant === "auth-panel") {
    return (
      <div className={`auth-brand-panel__brand-row ${className}`.trim()}>
        <BrandLockup
          variant="full"
          size="lg"
          tone="on-dark"
          href={href}
          className="auth-brand-panel__lockup"
        />
      </div>
    );
  }

  if (variant === "auth-mobile") {
    return (
      <div className={`auth-mobile-brand ${className}`.trim()}>
        <BrandLockup
          variant="full"
          size="sm"
          tone="on-light"
          href={href}
        />
      </div>
    );
  }

  const lockupTone: BrandLockupTone =
    tone != null
      ? mapTone(tone)
      : className.includes("on-dark")
        ? "on-dark"
        : "on-light";

  return (
    <BrandLockup
      variant={mapMark(mark)}
      size={mapSize(variant)}
      tone={lockupTone}
      href={href}
      className={className}
    />
  );
}
