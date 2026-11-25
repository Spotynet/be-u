"use client";

import Link from "next/link";
import type {ComponentType, ReactNode, SVGProps} from "react";
import {
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

type Base = {
  icon?: Icon;
  title: string;
  description?: string;
  trailing?: ReactNode;
  className?: string;
};

type LinkProps = Base & {
  href: string;
  external?: boolean;
  onClick?: never;
};

type ButtonProps = Base & {
  href?: never;
  external?: never;
  onClick: () => void;
};

export type AccountRowProps = LinkProps | ButtonProps;

const ROW =
  "group/row flex min-h-14 w-full min-w-0 items-center gap-3 px-4 py-3 text-left no-underline outline-none transition-colors duration-150 sm:min-h-[60px] sm:px-5 " +
  "hover:bg-foreground-muted/[0.06] focus-visible:bg-foreground-muted/[0.08] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary " +
  "motion-reduce:transition-none";

/**
 * Settings / account list row — full-row hit target, icon + title + optional meta.
 */
export function AccountRow(props: AccountRowProps) {
  const {icon: Icon, title, description, trailing, className = ""} = props;
  const external = "external" in props && props.external;

  const body = (
    <>
      {Icon ? (
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-foreground">
          {title}
        </span>
        {description ? (
          <span className="mt-0.5 block truncate text-[13px] text-foreground-secondary">
            {description}
          </span>
        ) : null}
      </span>
      {trailing ? (
        <span className="shrink-0 text-[13px] font-medium text-foreground-muted">
          {trailing}
        </span>
      ) : null}
      {external ? (
        <ArrowTopRightOnSquareIcon
          className="h-4 w-4 shrink-0 text-foreground-muted"
          aria-hidden
        />
      ) : (
        <ChevronRightIcon
          className="h-4 w-4 shrink-0 text-foreground-muted transition-transform duration-150 group-hover/row:translate-x-0.5 motion-reduce:transition-none"
          aria-hidden
        />
      )}
    </>
  );

  if ("href" in props && props.href) {
    if (external) {
      return (
        <a
          href={props.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ROW} ${className}`}
          aria-label={`${title} (se abre en una pestaña nueva)`}>
          {body}
        </a>
      );
    }
    return (
      <Link href={props.href} className={`${ROW} ${className}`}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={props.onClick} className={`${ROW} ${className}`}>
      {body}
    </button>
  );
}
