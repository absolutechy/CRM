import React from "react"

const CompaniesSectionSkeleton: React.FC = () => {
  return (
    <div className="flex gap-6">
      {/* Table skeleton - Left side */}
      <div className="flex-1 rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        {/* Table rows skeleton */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="mb-3 flex gap-3 border-b border-gray-100 pb-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-6 w-12 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Chart skeleton - Right side */}
      <div className="w-80 rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 h-4 w-24 animate-pulse rounded bg-gray-200" />

        {/* Pie chart skeleton */}
        <div className="mx-auto h-64 w-64 animate-pulse rounded-full bg-gray-100" />

        {/* Legend skeleton */}
        <div className="mt-8 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-gray-200" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-4 w-8 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CompaniesSectionSkeleton
