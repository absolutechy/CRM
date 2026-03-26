import React from "react"

const EmailChartSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2">
      {/* Header skeleton */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="h-7 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-7 w-24 animate-pulse rounded bg-gray-200" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="mb-2">
        <div className="flex items-baseline gap-1">
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="mt-1 h-4 w-32 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Chart skeleton */}
      <div className="w-full animate-pulse rounded bg-gray-100" style={{ height: "375px" }} />

      {/* Footer skeleton */}
      <div className="mt-1 border-t border-gray-200 pt-1">
        <div className="h-4 w-44 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  )
}

export default EmailChartSkeleton
