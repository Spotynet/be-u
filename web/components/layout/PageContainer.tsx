"use client";

type Size = "sm" | "md" | "lg";

const MAX: Record<Size, number> = {
  sm: 480,
  md: 560,
  lg: 640,
};

/**
 * Centers content and caps width so settings/forms don't stretch on desktop
 * while staying full-bleed (with shell padding) on phones.
 */
export function PageContainer({
  children,
  size = "md",
  style,
}: {
  children: React.ReactNode;
  size?: Size;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="nabbi-page"
      style={{
        width: "100%",
        maxWidth: MAX[size],
        margin: "0 auto",
        minWidth: 0,
        boxSizing: "border-box",
        ...style,
      }}>
      {children}
    </div>
  );
}
