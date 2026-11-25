import Link from "next/link";
import type {ComponentType, ReactNode, SVGProps} from "react";
import {Button} from "./Button";

type Size = "sm" | "md" | "lg";

type Action = {
  label: string;
  onClick?: () => void;
  href?: string;
};

type Props = {
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
  primaryAction?: Action;
  secondaryAction?: Action;
  size?: Size;
  className?: string;
  children?: ReactNode;
};

const PAD: Record<Size, string> = {
  sm: "px-4 py-8",
  md: "px-6 py-12",
  lg: "px-8 py-16",
};

const LINK_BTN =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2";

function ActionButton({
  action,
  variant,
}: {
  action: Action;
  variant: "primary" | "outline";
}) {
  if (action.href) {
    const styles =
      variant === "primary"
        ? "bg-secondary text-secondary-foreground hover:bg-secondary-hover"
        : "border border-card-border bg-transparent text-foreground hover:bg-primary-light/50";
    return (
      <Link href={action.href} className={`${LINK_BTN} ${styles}`}>
        {action.label}
      </Link>
    );
  }
  return (
    <Button type="button" variant={variant} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  size = "md",
  className = "",
  children,
}: Props) {
  return (
    <div
      className={[
        "flex w-full flex-col items-center justify-center text-center",
        PAD[size],
        className,
      ].join(" ")}
      role="status">
      {Icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground-secondary/10 text-foreground-secondary/70">
          <Icon className="h-7 w-7" aria-hidden />
        </div>
      ) : null}
      <h2 className="text-[17px] font-bold text-foreground sm:text-[18px]">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-[14px] text-foreground-secondary">{description}</p>
      ) : null}
      {children}
      {(primaryAction || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {primaryAction ? <ActionButton action={primaryAction} variant="primary" /> : null}
          {secondaryAction ? (
            <ActionButton action={secondaryAction} variant="outline" />
          ) : null}
        </div>
      )}
    </div>
  );
}
