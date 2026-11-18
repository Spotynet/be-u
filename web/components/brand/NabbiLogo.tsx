import Link from "next/link";

type Variant = "header" | "auth-panel" | "auth-mobile";

type Props = {
  variant?: Variant;
  /** When set, wraps in a Link (header default: "/"). Pass null to skip. */
  href?: string | null;
  className?: string;
};

/**
 * nabbi mark + wordmark. Header variant uses a dark tile so the light mark
 * stays legible on the warm page canvas (same idea as the auth brand panel).
 */
export function NabbiLogo({
  variant = "header",
  href = "/",
  className = "",
}: Props) {
  if (variant === "auth-panel") {
    return (
      <div className={`auth-brand-panel__brand-row ${className}`.trim()}>
        <div className="auth-brand-panel__mark">
          <img src="/nabbi_logo_t.png" alt="" width={67} height={67} />
        </div>
        <span className="auth-brand-panel__wordmark">nabbi</span>
      </div>
    );
  }

  if (variant === "auth-mobile") {
    return (
      <div className={`auth-mobile-brand ${className}`.trim()}>
        <img src="/nabbi_logo_t.png" alt="" width={53} height={53} />
        <span>nabbi</span>
      </div>
    );
  }

  const inner = (
    <>
      <span className="nabbi-logo__tile" aria-hidden="true">
        <img src="/nabbi_logo_t.png" alt="" width={36} height={36} />
      </span>
      <span className="nabbi-logo__word">nabbi</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`nabbi-logo lp-focus ${className}`.trim()}
        aria-label="nabbi, ir al inicio">
        {inner}
      </Link>
    );
  }

  return <span className={`nabbi-logo ${className}`.trim()}>{inner}</span>;
}
