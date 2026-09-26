import MainContentWrapper from "@/components/common/MainContentWrapper"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Fallback for the route-level <Suspense> boundary, shown while a page's JS
 * chunk downloads. Deliberately generic — it stands in for any route, so it
 * mimics the shared chrome (PageHeader bar, toolbar, table) rather than any
 * one page. The sidebar and app header stay mounted behind it.
 */
const PageSkeleton = () => (
  <>
    {/* Matches PageHeader: h-14, bottom border, surface background */}
    <div className="mb-0 flex h-14 items-center border-b border-border bg-surface px-8">
      <Skeleton className="h-7 w-40" />
    </div>

    <MainContentWrapper className="space-y-6 px-8">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-8 w-full sm:max-w-xs" />
        <div className="flex items-center gap-2 sm:ml-auto">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>

      {/* Table body */}
      <div className="rounded-lg border border-border bg-surface">
        {Array.from({ length: 6 }).map((_, row) => (
          <div
            key={row}
            className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
          >
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    </MainContentWrapper>
  </>
)

export default PageSkeleton
export { PageSkeleton }
