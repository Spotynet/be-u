"use client";

import type {ReactNode} from "react";
import {Card} from "@/components/ui/Card";

type Props = {
  label: string;
  children: ReactNode;
  className?: string;
};

/** Group card: uppercase label + list of AccountRows. */
export function AccountGroupCard({label, children, className = ""}: Props) {
  return (
    <Card
      padding="none"
      className={`min-w-0 overflow-hidden ${className}`}
      as="section"
      aria-label={label}>
      <h2 className="border-b border-card-border px-4 pb-2 pt-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted sm:px-5">
        {label}
      </h2>
      <ul className="divide-y divide-card-border" role="list">
        {children}
      </ul>
    </Card>
  );
}
