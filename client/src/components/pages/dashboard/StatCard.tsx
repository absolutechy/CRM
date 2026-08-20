import React from "react"
import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface StatCardProps {
  icon: LucideIcon
  title: string
  value: string
  subtitle: string
  /** Optional emphasis when the number needs attention (e.g. overdue work). */
  tone?: "default" | "warning"
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  title,
  value,
  subtitle,
  tone = "default",
}) => {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p
            className={cn(
              "text-2xl font-bold tabular-nums",
              tone === "warning" ? "text-warning-strong" : "text-foreground"
            )}
          >
            {value}
          </p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div
          className={cn(
            "shrink-0 rounded-full p-3",
            tone === "warning" ? "bg-warning-soft" : "bg-primary-100"
          )}
        >
          <Icon
            className={cn(
              "h-6 w-6",
              tone === "warning" ? "text-warning-strong" : "text-primary-700"
            )}
          />
        </div>
      </div>
    </div>
  )
}

export default StatCard
