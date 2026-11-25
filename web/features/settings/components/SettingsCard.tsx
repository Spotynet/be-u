"use client";

import type {ComponentType, ReactNode, SVGProps} from "react";
import {CardHeader} from "@/components/layout/CardHeader";

export type SettingsCardSpan = "auto" | "full";

type Props = {
  /** Optional DOM id (avoid colliding with tabpanel ids). */
  id?: string;
  title: string;
  description?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /** Right-aligned control on the title row (e.g. Activar/Desactivar todo). */
  action?: ReactNode;
  /**
   * `compact` = short text actions that stay on the title row when the card is narrow.
   * `wide` = buttons that wrap under the description below 420px card width.
   */
  actionTone?: "compact" | "wide";
  children: ReactNode;
  className?: string;
  /** Soft danger surface for zona delicada. */
  danger?: boolean;
  /** Grid span: auto (peer) or full row. */
  span?: SettingsCardSpan;
  /** Heading element. Default h2. */
  headingAs?: "h2" | "h3";
};

const SPAN_CLASS: Record<SettingsCardSpan, string> = {
  auto: "",
  full: "nabbi-settings-card--span-full",
};

export function SettingsCard({
  id,
  title,
  description,
  icon,
  action,
  actionTone = "compact",
  children,
  className = "",
  danger = false,
  span = "auto",
  headingAs = "h2",
}: Props) {
  const titleId = id ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={[
        "nabbi-settings-card nabbi-layout-card",
        danger ? "nabbi-settings-card--danger" : "",
        SPAN_CLASS[span],
        className,
      ]
        .filter(Boolean)
        .join(" ")}>
      <CardHeader
        id={id}
        title={title}
        description={description}
        icon={icon}
        headingAs={headingAs}
        actions={
          action ? (
            <div
              className={[
                "nabbi-settings-card__action",
                actionTone === "wide" ? "nabbi-settings-card__action--wide" : "",
              ]
                .filter(Boolean)
                .join(" ")}>
              {action}
            </div>
          ) : undefined
        }
        className="!px-[var(--card-pad)]"
      />
      <div className="nabbi-settings-card__body">{children}</div>
    </section>
  );
}
