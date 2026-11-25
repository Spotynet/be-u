import {Skeleton} from "@/components/ui/Skeleton";

/** Card-shaped skeleton matching FavoriteCard / ResultCard geometry. */
export function FavoriteSkeleton({className = ""}: {className?: string}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-card-border bg-card ${className}`}
      aria-busy="true"
      aria-label="Cargando">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-2 p-3.5">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
