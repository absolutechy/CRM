import { Skeleton } from "@/components/ui/skeleton"
import React from "react"

const CompaniesSectionSkeleton: React.FC = () => {
  return (
    <div className="flex gap-6">
      {/* Table skeleton - Left side */}
      <div className="flex-1 rounded-lg border border-border bg-surface p-6">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-5 w-20 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
          </div>
        </div>

        {/* Table rows skeleton */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="mb-3 flex gap-3 border-b border-border pb-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
            <Skeleton className="h-6 w-12 rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton - Right side */}
      <div className="w-80 rounded-lg border border-border bg-surface p-6">
        <Skeleton className="mb-4 h-4 w-24 rounded" />

        {/* Pie chart skeleton */}
        <Skeleton className="mx-auto h-64 w-64 rounded-full" />

        {/* Legend skeleton */}
        <div className="mt-8 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <Skeleton className="h-4 w-8 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CompaniesSectionSkeleton
