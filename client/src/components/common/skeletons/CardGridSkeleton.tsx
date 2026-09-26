import { Skeleton } from "@/components/ui/skeleton"

interface CardGridSkeletonProps {
  cards?: number
}

/**
 * Placeholder for card-grid surfaces (e.g. the automation rules list), which
 * don't go through DataTable. Matches the real card chrome so the grid keeps
 * its shape while loading.
 */
const CardGridSkeleton = ({ cards = 4 }: CardGridSkeletonProps) => (
  <div className="grid gap-4 md:grid-cols-2">
    {Array.from({ length: cards }).map((_, card) => (
      <article
        key={card}
        className="flex flex-col rounded-lg border border-border bg-surface p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </article>
    ))}
  </div>
)

export default CardGridSkeleton
export { CardGridSkeleton }
