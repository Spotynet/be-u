import {Card} from "@/components/ui/Card";
import {Skeleton} from "@/components/ui/Skeleton";

export function AccountSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 @min-[1024px]:grid @min-[1024px]:grid-cols-[minmax(320px,360px)_minmax(0,1fr)] @min-[1024px]:gap-6"
      aria-busy="true"
      aria-label="Cargando cuenta">
      <Card padding="lg" className="rounded-3xl">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-28 w-28 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
        <div className="mt-5 space-y-2">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </Card>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex gap-3 overflow-hidden">
          <Skeleton className="h-28 flex-1 rounded-[20px]" />
          <Skeleton className="h-28 flex-1 rounded-[20px]" />
          <Skeleton className="hidden h-28 flex-1 rounded-[20px] @min-[640px]:block" />
        </div>
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    </div>
  );
}
