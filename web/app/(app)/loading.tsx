import {SkeletonCard, SkeletonList} from "@/components/ui/Skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando">
      <div className="space-y-2 py-2">
        <div className="h-3 w-24 animate-pulse rounded bg-foreground-muted/15 motion-reduce:animate-none" />
        <div className="h-7 w-48 animate-pulse rounded bg-foreground-muted/15 motion-reduce:animate-none" />
      </div>
      <SkeletonList rows={4} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
