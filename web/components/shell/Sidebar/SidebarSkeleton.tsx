"use client";

import {Skeleton} from "@/components/ui/Skeleton";
import {
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_RAIL,
} from "@/components/shell/shell-config";

type Props = {
  pinned?: boolean;
  /** @deprecated use pinned */
  collapsed?: boolean;
};

export function SidebarSkeleton({
  pinned,
  collapsed,
}: Props) {
  const isPinned = typeof pinned === "boolean" ? pinned : !collapsed;
  const width = isPinned ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_RAIL;
  const rail = !isPinned;
  return (
    <aside
      className="nabbi-sidebar nabbi-sidebar--frame hidden shrink-0 flex-col lg:flex"
      style={{width}}
      aria-hidden
      aria-busy="true">
      <div
        className={[
          "flex h-16 items-center gap-2 px-5",
          rail ? "justify-center px-3" : "justify-between",
        ].join(" ")}>
        <Skeleton className="h-8 w-8 rounded-[var(--r-ctl)] bg-white/10" />
        {!rail ? <Skeleton className="h-5 w-24 rounded bg-white/10" /> : null}
      </div>
      <div className="flex flex-col gap-1 px-3 py-2">
        {Array.from({length: 6}).map((_, i) => (
          <Skeleton
            key={i}
            className={[
              "rounded-[var(--r-tile)] bg-white/10",
              rail ? "mx-auto h-12 w-12" : "h-11 w-full",
            ].join(" ")}
          />
        ))}
      </div>
      <div className="mt-6 px-3">
        <div className={rail ? "flex justify-center" : "flex items-center gap-3"}>
          <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
          {!rail ? (
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28 rounded bg-white/10" />
              <Skeleton className="h-3 w-16 rounded bg-white/10" />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
