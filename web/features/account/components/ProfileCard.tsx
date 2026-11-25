"use client";

import Link from "next/link";
import type {ReactNode} from "react";
import {PencilIcon} from "@heroicons/react/24/outline";
import {Avatar} from "@/components/ui/Avatar";
import {Card} from "@/components/ui/Card";
import {Skeleton} from "@/components/ui/Skeleton";

type Props = {
  name: string;
  email?: string | null;
  avatarSrc?: string | null;
  chips?: ReactNode;
  /** Primary CTA (yellow pill). */
  primaryAction?: {label: string; href: string};
  /** Ghost secondary under CTA. */
  secondaryAction?: {label: string; href: string};
  /** Edit badge on avatar — omit if no edit route. */
  editHref?: string;
  fields?: ReactNode;
  loading?: boolean;
  className?: string;
};

export function ProfileCard({
  name,
  email,
  avatarSrc,
  chips,
  primaryAction,
  secondaryAction,
  editHref,
  fields,
  loading = false,
  className = "",
}: Props) {
  if (loading) {
    return (
      <Card
        padding="lg"
        className={`min-w-0 rounded-3xl shadow-card ${className}`}>
        <div className="flex flex-col items-center gap-4 @min-[640px]:flex-row @min-[640px]:items-center @min-[1024px]:flex-col">
          <Skeleton className="h-20 w-20 rounded-full @min-[1024px]:h-28 @min-[1024px]:w-28" />
          <div className="w-full space-y-2 text-center @min-[640px]:text-left @min-[1024px]:text-center">
            <Skeleton className="mx-auto h-6 w-40 @min-[640px]:mx-0 @min-[1024px]:mx-auto" />
            <Skeleton className="mx-auto h-4 w-48 @min-[640px]:mx-0 @min-[1024px]:mx-auto" />
            <Skeleton className="mx-auto h-5 w-24 rounded-full @min-[640px]:mx-0 @min-[1024px]:mx-auto" />
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      padding="lg"
      className={`min-w-0 rounded-3xl border-card-border/60 shadow-card ${className}`}
      aria-labelledby="account-profile-name">
      <div className="flex flex-col items-center gap-4 text-center @min-[640px]:flex-row @min-[640px]:items-center @min-[640px]:text-left @min-[1024px]:flex-col @min-[1024px]:text-center">
        <div className="relative shrink-0">
          <Avatar
            src={avatarSrc}
            name={name}
            size="xl"
            fallbackTone="cta"
            className="!h-20 !w-20 text-[22px] ring-4 ring-card @min-[1024px]:!h-28 @min-[1024px]:!w-28 @min-[1024px]:text-[28px]"
            ringClassName="ring-card"
          />
          {editHref ? (
            <Link
              href={editHref}
              className="absolute -bottom-0.5 -right-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-card-border bg-card text-foreground shadow-card outline-none hover:bg-foreground-muted/10 focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Editar perfil">
              <PencilIcon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </Link>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <h2
            id="account-profile-name"
            className="truncate text-[20px] font-semibold leading-7 tracking-tight text-foreground @min-[1024px]:text-[22px] @min-[1024px]:leading-7">
            {name}
          </h2>
          {email ? (
            <p className="mt-0.5 truncate text-[13px] text-foreground-secondary" title={email}>
              {email}
            </p>
          ) : null}
          {chips ? (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 @min-[640px]:justify-start @min-[1024px]:justify-center">
              {chips}
            </div>
          ) : null}
        </div>

        {primaryAction || secondaryAction ? (
          <div className="flex w-full shrink-0 flex-col gap-2 @min-[640px]:w-auto @min-[1024px]:w-full">
            {primaryAction ? (
              <Link
                href={primaryAction.href}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-secondary px-5 text-[14px] font-bold text-secondary-foreground no-underline transition-colors hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2">
                {primaryAction.label}
              </Link>
            ) : null}
            {secondaryAction ? (
              <Link
                href={secondaryAction.href}
                className="inline-flex h-10 w-full items-center justify-center rounded-full text-[13px] font-semibold text-foreground-secondary no-underline hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {secondaryAction.label}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      {fields ? <div className="mt-5 flex flex-col gap-2">{fields}</div> : null}
    </Card>
  );
}
