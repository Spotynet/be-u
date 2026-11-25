"use client";

import {useEffect, useRef, type ReactNode} from "react";
import {
  usePageHeaderVisibility,
  type PageHeaderChrome,
} from "@/components/shell/usePageHeader";

type Props = {
  title: string;
  description?: ReactNode;
  /** Inline meta chips (avatar+text, pills). */
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /**
   * Registers condensed breadcrumb behavior (same as compact PageHeader).
   * @deprecated Prefer always compact chrome for migrated pages.
   */
  chrome?: PageHeaderChrome;
};

/**
 * Page title row below the breadcrumb bar.
 * Title left + optional meta + description; actions right.
 */
export function PageHeaderRow({
  title,
  description,
  meta,
  actions,
  className = "",
  chrome = "compact",
}: Props) {
  const headerRef = useRef<HTMLElement | null>(null);
  const {registerHeaderEl, setHeaderChrome} = usePageHeaderVisibility();

  useEffect(() => {
    setHeaderChrome(chrome);
    registerHeaderEl(headerRef.current);
    return () => {
      registerHeaderEl(null);
      setHeaderChrome(null);
    };
  }, [registerHeaderEl, setHeaderChrome, title, chrome]);

  return (
    <header
      ref={headerRef}
      className={["nabbi-page-header-row", className].filter(Boolean).join(" ")}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <h1 className="nabbi-page-header-row__title">{title}</h1>
          {meta ? (
            <div className="nabbi-page-header-row__meta" aria-live="polite">
              {meta}
            </div>
          ) : null}
        </div>
        {description ? (
          <p className="nabbi-page-header-row__desc">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="nabbi-page-header-row__actions">{actions}</div>
      ) : null}
    </header>
  );
}
