"use client";

import type {ComponentType, ReactNode, SVGProps} from "react";

type Props = {
  title: string;
  description?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /** Circular icon buttons or "Ver todo" text action. */
  actions?: ReactNode;
  headingAs?: "h2" | "h3";
  className?: string;
  id?: string;
};

/**
 * Shared card header: filled circle icon + title + right actions (Ref B).
 * Replaces ad hoc card headers across authenticated pages.
 */
export function CardHeader({
  title,
  description,
  icon: Icon,
  actions,
  headingAs = "h2",
  className = "",
  id,
}: Props) {
  const Heading = headingAs;
  const titleId = id ? `${id}-title` : undefined;
  return (
    <header
      className={["nabbi-card-header", className].filter(Boolean).join(" ")}>
      {Icon ? (
        <span className="nabbi-card-header__icon" aria-hidden>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
      ) : null}
      <div className="nabbi-card-header__titles">
        <Heading id={titleId} className="nabbi-card-header__title">
          {title}
        </Heading>
        {description ? (
          <p className="nabbi-card-header__desc">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="nabbi-card-header__actions">{actions}</div>
      ) : null}
    </header>
  );
}
