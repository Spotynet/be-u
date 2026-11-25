"use client";

import Link from "next/link";
import type {ReactNode} from "react";
import {CheckBadgeIcon, PencilIcon} from "@heroicons/react/24/solid";
import {Avatar} from "@/components/ui/Avatar";
import {Badge} from "@/components/ui/Badge";
import {Card} from "@/components/ui/Card";
import {Skeleton} from "@/components/ui/Skeleton";
import {roleLabelEs} from "@/lib/roles";

export type SummaryDetail = {
  id: string;
  label: string;
  value: ReactNode;
  icon?: ReactNode;
};

type Props = {
  name: string;
  email?: string | null;
  role?: string | null;
  avatarSrc?: string | null;
  verified?: boolean;
  details: SummaryDetail[];
  onEdit?: () => void;
  exploreHref?: string;
  loading?: boolean;
  className?: string;
};

/**
 * Two-zone identity card: top (avatar + identity + actions), bottom details strip.
 * Soft radial tint behind avatar — no clipped accent fringe.
 */
export function AccountSummary({
  name,
  email,
  role,
  avatarSrc,
  verified = false,
  details,
  onEdit,
  exploreHref = "/explore",
  loading = false,
  className = "",
}: Props) {
  if (loading) {
    return (
      <Card
        padding="none"
        className={`nabbi-account-summary overflow-hidden rounded-[20px] border-card-border shadow-card ${className}`}>
        <div className="flex flex-col gap-4 p-5 @min-[600px]:flex-row @min-[600px]:items-center @min-[900px]:gap-6 @min-[900px]:p-6">
          <Skeleton className="mx-auto h-[88px] w-[88px] rounded-full @min-[600px]:mx-0" />
          <div className="min-w-0 flex-1 space-y-2 text-center @min-[600px]:text-left">
            <Skeleton className="mx-auto h-7 w-48 @min-[600px]:mx-0" />
            <Skeleton className="mx-auto h-4 w-56 @min-[600px]:mx-0" />
            <Skeleton className="mx-auto h-6 w-28 rounded-full @min-[600px]:mx-0" />
          </div>
          <Skeleton className="h-10 w-full rounded-full @min-[600px]:w-36" />
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-card-border bg-foreground-muted/10 p-4 @min-[900px]:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl bg-card" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <section aria-labelledby="account-summary-name" className={className}>
      <Card
        padding="none"
        className="nabbi-account-summary relative overflow-hidden rounded-[20px] border-card-border shadow-card">
        {/* Soft brand tint — clipped by card overflow, never a hard strip */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden>
          <div className="absolute -left-8 -top-10 h-44 w-44 rounded-full bg-primary/[0.08] blur-2xl" />
        </div>

        {/* Top zone */}
        <div
          className={[
            "relative flex flex-col gap-4 p-5",
            "@min-[600px]:flex-row @min-[600px]:items-center @min-[600px]:gap-5",
            "@min-[900px]:gap-6 @min-[900px]:p-6",
          ].join(" ")}>
          <div
            className={[
              "flex min-w-0 flex-1 flex-col items-center gap-3 text-center",
              "@min-[600px]:flex-row @min-[600px]:items-center @min-[600px]:text-left",
            ].join(" ")}>
            <Avatar
              src={avatarSrc}
              name={name}
              size="xl"
              fallbackTone="cta"
              className="!h-[88px] !w-[88px] text-[28px] ring-4 ring-card outline outline-1 outline-card-border"
              ringClassName="ring-card"
            />
            <div className="min-w-0">
              <h2
                id="account-summary-name"
                className="truncate text-[26px] font-semibold leading-8 tracking-[-0.02em] text-foreground">
                {name}
              </h2>
              {email ? (
                <p
                  className="mt-0.5 truncate text-[14px] text-foreground-secondary"
                  title={email}>
                  {email}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 @min-[600px]:justify-start">
                <Badge tone="brand" size="sm" className="h-6">
                  {roleLabelEs(role)}
                </Badge>
                {verified ? (
                  <Badge
                    tone="success"
                    size="sm"
                    className="h-6"
                    icon={<CheckBadgeIcon aria-hidden />}>
                    Verificado
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div
            className={[
              "flex w-full flex-col gap-2",
              "@min-[600px]:ml-auto @min-[600px]:w-auto @min-[600px]:flex-row @min-[600px]:items-center",
            ].join(" ")}>
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-secondary px-5 text-[14px] font-bold text-secondary-foreground outline-none transition-colors hover:bg-secondary-hover focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 @min-[600px]:w-auto">
                <PencilIcon className="h-4 w-4" aria-hidden />
                Editar perfil
              </button>
            ) : null}
            <Link
              href={exploreHref}
              className="inline-flex h-10 w-full items-center justify-center rounded-full border border-card-border bg-transparent px-5 text-[14px] font-semibold text-foreground no-underline outline-none transition-colors hover:bg-foreground-muted/10 focus-visible:ring-2 focus-visible:ring-secondary @min-[600px]:w-auto">
              Reservar un servicio
            </Link>
          </div>
        </div>

        {/* Bottom zone — details strip */}
        {details.length ? (
          <dl
            className={[
              "relative m-0 grid gap-px border-t border-card-border bg-card-border",
              "grid-cols-1",
              "@min-[480px]:grid-cols-2",
              "@min-[900px]:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]",
            ].join(" ")}>
            {details.map((d) => (
              <div
                key={d.id}
                className="nabbi-account-summary__detail flex min-w-0 flex-col gap-1 px-6 py-4">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
                  {d.icon ? (
                    <span className="inline-flex text-foreground-secondary [&_svg]:h-4 [&_svg]:w-4">
                      {d.icon}
                    </span>
                  ) : null}
                  {d.label}
                </dt>
                <dd className="m-0 truncate text-[14px] font-medium text-foreground">
                  {d.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Card>
    </section>
  );
}
