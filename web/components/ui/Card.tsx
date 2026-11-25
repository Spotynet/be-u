import {
  createElement,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type CardOwnProps = {
  children: ReactNode;
  className?: string;
  /** Soft hover lift */
  hover?: boolean;
  /** Interactive: focus ring + cursor */
  interactive?: boolean;
  /** Polymorphic root element */
  as?: ElementType;
  padding?: "sm" | "md" | "lg" | "none";
};

type CardProps = CardOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof CardOwnProps>;

const PAD = {
  none: "",
  sm: "p-3.5",
  md: "p-4 sm:p-5",
  lg: "p-5",
} as const;

export function Card({
  children,
  className = "",
  hover = false,
  interactive = false,
  as: Comp = "div",
  padding = "none",
  ...rest
}: CardProps) {
  return createElement(
    Comp,
    {
      className: [
        "bg-card text-card-foreground border border-card-border rounded-2xl shadow-card",
        PAD[padding],
        hover || interactive
          ? "transition-[box-shadow,transform] duration-150 motion-reduce:transition-none hover:shadow-card-hover hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : "",
        interactive
          ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" "),
      tabIndex: interactive ? 0 : rest.tabIndex,
      ...rest,
    },
    children
  );
}

interface SlotProps {
  children: ReactNode;
  className?: string;
}

/**
 * Padding slot only.
 * @deprecated Prefer `@/components/layout/CardHeader` (icon + title + actions).
 */
export const CardHeader = ({children, className = ""}: SlotProps) => (
  <div className={`p-5 pb-0 ${className}`}>{children}</div>
);

export const CardContent = ({children, className = ""}: SlotProps) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

export const CardFooter = ({children, className = ""}: SlotProps) => (
  <div className={`p-5 pt-0 ${className}`}>{children}</div>
);
