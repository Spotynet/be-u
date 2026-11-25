import {SkeletonCard} from "@/components/ui/Skeleton";

export default function ExploreLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando Explorar">
      <div className="space-y-2 py-2">
        <div className="h-3 w-24 animate-pulse rounded bg-foreground-muted/15 motion-reduce:animate-none" />
        <div className="h-7 w-40 animate-pulse rounded bg-foreground-muted/15 motion-reduce:animate-none" />
      </div>
      <div className="h-28 animate-pulse rounded-2xl bg-foreground-muted/10 motion-reduce:animate-none" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({length: 6}).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
