"use client";

type Size = "sm" | "md" | "lg" | "content" | "wide" | "full";

const MAX: Record<Size, number | undefined> = {
  sm: 480,
  md: 560,
  lg: 640,
  content: 720,
  wide: 1100,
  full: undefined,
};

/**
 * Centers content and caps width.
 * sm/md/lg — settings/forms (phone column on desktop)
 * content/wide/full — marketplace browse and store pages
 */
export function PageContainer({
  children,
  size = "md",
  style,
  className = "",
}: {
  children: React.ReactNode;
  size?: Size;
  style?: React.CSSProperties;
  className?: string;
}) {
  const maxWidth = MAX[size];
  return (
    <div
      className={`nabbi-page ${className}`}
      style={{
        width: "100%",
        maxWidth: maxWidth ?? "100%",
        margin: maxWidth ? "0 auto" : undefined,
        minWidth: 0,
        boxSizing: "border-box",
        ...style,
      }}>
      {children}
    </div>
  );
}
