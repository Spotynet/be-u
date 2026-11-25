import type {ReactNode} from "react";

type Tone = "neutral" | "brand" | "success" | "warning" | "error" | "info";
type Size = "sm" | "md";

type Props = {
  children: ReactNode;
  tone?: Tone;
  size?: Size;
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
};

const TONE: Record<Tone, string> = {
  neutral: "bg-foreground-muted/12 text-foreground-secondary",
  brand: "bg-primary-light text-primary-dark",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning-foreground",
  error: "bg-error-light text-error",
  info: "bg-accent/15 text-accent",
};

const SIZE: Record<Size, string> = {
  sm: "gap-1 px-2 py-0.5 text-[11px]",
  md: "gap-1.5 px-2.5 py-1 text-[12px]",
};

export function Badge({
  children,
  tone = "neutral",
  size = "sm",
  dot = false,
  icon,
  className = "",
}: Props) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full font-semibold",
        TONE[tone],
        SIZE[size],
        className,
      ].join(" ")}>
      {dot ? (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      ) : null}
      {icon ? <span className="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span> : null}
      {children}
    </span>
  );
}
