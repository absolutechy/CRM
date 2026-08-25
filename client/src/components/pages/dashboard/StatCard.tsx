import React from "react"
import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** Accent options that map to the design-system color tokens. */
export type StatTone = "default" | "info" | "success" | "warning" | "destructive"

interface StatCardProps {
  icon: LucideIcon
  title: string
  value: string
  subtitle?: string
  /** Accent color. "default" uses the primary (indigo) token. */
  tone?: StatTone
  /**
   * Optional mini-series rendered as a sparkline on the right of the card.
   * Pass an array of numbers; a small SVG polyline is drawn with the accent
   * color. Omit to show only the icon block.
   */
  sparkline?: number[]
}

const ACCENT: Record<
  StatTone,
  { chip: string; icon: string; text: string; stroke: string; fill: string }
> = {
  default: {
    chip: "bg-primary-100",
    icon: "text-primary-700",
    text: "text-foreground",
    stroke: "var(--primary-500)",
    fill: "var(--primary-200)",
  },
  info: {
    chip: "bg-info-soft",
    icon: "text-info-strong",
    text: "text-info-strong",
    stroke: "var(--info)",
    fill: "var(--info-soft)",
  },
  success: {
    chip: "bg-success-soft",
    icon: "text-success-strong",
    text: "text-success-strong",
    stroke: "var(--success)",
    fill: "var(--success-soft)",
  },
  warning: {
    chip: "bg-warning-soft",
    icon: "text-warning-strong",
    text: "text-warning-strong",
    stroke: "var(--warning)",
    fill: "var(--warning-soft)",
  },
  destructive: {
    chip: "bg-destructive/10",
    icon: "text-destructive",
    text: "text-destructive",
    stroke: "var(--destructive)",
    fill: "var(--destructive)",
  },
}

/** Tiny sparkline — a 48x24 SVG polyline with a soft area fill + end dot. */
const Sparkline: React.FC<{ data: number[]; stroke: string; fill: string }> = ({
  data,
  stroke,
  fill,
}) => {
  if (data.length < 2) return null
  const w = 48
  const h = 24
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - 2) + 1
    const y = h - 2 - ((v - min) / span) * (h - 4)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const area = `1,${h - 1} ${pts.join(" ")} ${w - 1},${h - 1}`
  const [lastX, lastY] = pts[pts.length - 1]!.split(",")

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 overflow-visible">
      <polygon points={area} fill={fill} opacity={0.4} />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={Number(lastX)} cy={Number(lastY)} r={2.2} fill={stroke} />
    </svg>
  )
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  title,
  value,
  subtitle,
  tone = "default",
  sparkline,
}) => {
  const accent = ACCENT[tone]

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-5">
      {/* Icon block */}
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          accent.chip
        )}
      >
        <Icon className={cn("size-5", accent.icon)} />
      </span>

      {/* Label + value */}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
        {subtitle && (
          <p className={cn("truncate text-xs font-medium", accent.text)}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Sparkline */}
      {sparkline && sparkline.length >= 2 ? (
        <Sparkline
          data={sparkline}
          stroke={accent.stroke}
          fill={accent.fill}
        />
      ) : null}
    </div>
  )
}

export default StatCard
export { Sparkline }
