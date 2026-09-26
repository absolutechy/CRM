import { Skeleton } from "@/components/ui/skeleton"
import React from "react"

const EmailChartSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg border border-border bg-surface p-2">
      {/* Header skeleton */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-40 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-40 rounded" />
          <Skeleton className="h-7 w-24 rounded" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="mb-2">
        <div className="flex items-baseline gap-1">
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
        <Skeleton className="mt-1 h-4 w-32 rounded" />
      </div>

      {/* Chart skeleton */}
      <Skeleton className="w-full" style={{ height: "375px" }} />

      {/* Footer skeleton */}
      <div className="mt-1 border-t border-border pt-1">
        <Skeleton className="h-4 w-44 rounded" />
      </div>
    </div>
  )
}

export default EmailChartSkeleton
