import type {HTMLAttributes} from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

/** Base shimmer block — respects prefers-reduced-motion via CSS. */
export function Skeleton({className = "", ...rest}: Props) {
  return (
    <div
      className={`nabbi-skeleton animate-pulse rounded-xl bg-foreground-muted/15 motion-reduce:animate-none ${className}`}
      aria-hidden
      {...rest}
    />
  );
}

export function SkeletonCard({className = ""}: {className?: string}) {
  return (
    <div
      className={`rounded-2xl border border-card-border bg-card p-4 ${className}`}
      aria-busy="true"
      aria-label="Cargando">
      <Skeleton className="mb-3 h-4 w-1/3" />
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="mb-2 h-3 w-5/6" />
      <Skeleton className="mt-4 h-9 w-28 rounded-full" />
    </div>
  );
}

export function SkeletonList({
  rows = 3,
  className = "",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-3 ${className}`} aria-busy="true" aria-label="Cargando">
      {Array.from({length: rows}).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-2 h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
