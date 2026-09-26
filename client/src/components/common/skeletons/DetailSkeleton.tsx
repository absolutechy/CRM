import MainContentWrapper from "@/components/common/MainContentWrapper"
import { Skeleton } from "@/components/ui/skeleton"

interface DetailSkeletonProps {
  /** Tab pills to draw above the panels. */
  tabs?: number
  /** Card blocks below the header. */
  panels?: number
}

/**
 * Stand-in for an entity detail page while the record loads. Mirrors the real
 * page's containers (same wrapper padding, same card chrome) so nothing jumps
 * when the data arrives.
 */
const DetailSkeleton = ({ tabs = 3, panels = 2 }: DetailSkeletonProps) => (
  <MainContentWrapper className="space-y-6 px-8">
    {/* Back link */}
    <Skeleton className="h-4 w-28" />

    {/* Identity + actions */}
    <div className="flex items-center gap-4">
      <Skeleton className="size-12 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-9 w-24" />
    </div>

    {/* Tab strip */}
    {tabs > 0 && (
      <div className="flex gap-2">
        {Array.from({ length: tabs }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24" />
        ))}
      </div>
    )}

    {/* Content cards */}
    {Array.from({ length: panels }).map((_, panel) => (
      <div
        key={panel}
        className="space-y-3 rounded-lg border border-border bg-surface p-6"
      >
        <Skeleton className="h-5 w-36" />
        {["w-full", "w-11/12", "w-4/5", "w-2/3"].map((width, line) => (
          <Skeleton key={line} className={`h-4 ${width}`} />
        ))}
      </div>
    ))}
  </MainContentWrapper>
)

export default DetailSkeleton
export { DetailSkeleton }
