import { Skeleton } from "@/components/ui/skeleton"

interface KanbanSkeletonProps {
  columns?: number
  cardsPerColumn?: number
}

/**
 * Stand-in for the Tasks board. Column chrome mirrors Column.tsx so the
 * placeholder occupies the same space the real board will.
 */
const KanbanSkeleton = ({
  columns = 4,
  cardsPerColumn = 3,
}: KanbanSkeletonProps) => (
  <div className="flex h-full items-start gap-6">
    {Array.from({ length: columns }).map((_, column) => (
      <div
        key={column}
        className="flex w-full max-w-[350px] min-w-[300px] shrink-0 flex-col rounded-[8px] border p-4"
      >
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="size-3 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        <Skeleton className="my-3 h-10 w-full rounded" />

        <div className="flex flex-col gap-3">
          {Array.from({ length: cardsPerColumn }).map((_, card) => (
            <Skeleton key={card} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    ))}
  </div>
)

export default KanbanSkeleton
export { KanbanSkeleton }
