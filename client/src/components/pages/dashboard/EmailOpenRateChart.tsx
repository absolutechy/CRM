import React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { STAGE_BADGE, formatCurrency } from "@/lib/crm"
import { useAppSelector } from "@/store/hooks"
import { selectPipelineSummary, selectValueByStage } from "@/store/dealsSlice"
import { selectEmailStats } from "@/store/emailSlice"
import { DEAL_STAGES, type DealStage } from "@/types/crm"

/** Stages get distinct chart tokens so the funnel reads left to right. */
const STAGE_FILL: Record<DealStage, string> = {
  New: "var(--primary-200)",
  Contacted: "var(--primary-300)",
  Qualified: "var(--primary-400)",
  Negotiation: "var(--primary-500)",
  Won: "var(--success)",
  Lost: "var(--muted-foreground)",
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: { stage: DealStage; value: number; count: number } }>
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-surface p-3 shadow-lg">
      <p className="text-sm font-semibold text-foreground">{d.stage}</p>
      <p className="text-sm text-muted-foreground">
        {formatCurrency(d.value)} · {d.count}{" "}
        {d.count === 1 ? "deal" : "deals"}
      </p>
    </div>
  )
}

/**
 * Pipeline value by stage, read from the deals store. This replaced a
 * hardcoded twelve-month email series that wasn't backed by any data.
 */
const PipelineByStageChart: React.FC = () => {
  const byStage = useAppSelector(selectValueByStage)
  const pipeline = useAppSelector(selectPipelineSummary)
  const emails = useAppSelector(selectEmailStats)

  const data = DEAL_STAGES.map((stage) => ({
    stage,
    value: byStage.get(stage)?.value ?? 0,
    count: byStage.get(stage)?.count ?? 0,
  }))

  const openRate = emails.sent
    ? Math.round((emails.opened / emails.sent) * 100)
    : 0

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Pipeline by stage
          </h3>
          <p className="text-xs text-muted-foreground">
            Total value of every deal at each stage
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/deals">View deals</Link>
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {formatCurrency(pipeline.openValue, pipeline.currency)}
        </span>
        <span className="text-xs text-muted-foreground">
          open · weighted{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(pipeline.weightedValue, pipeline.currency)}
          </span>
        </span>
        <Badge variant={STAGE_BADGE.Won} className="ml-auto">
          {pipeline.winRate}% win rate
        </Badge>
      </div>

      <div className="min-h-56 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="stage"
              stroke="var(--border)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              stroke="var(--border)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              width={54}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
              }
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={44}>
              {data.map((entry) => (
                <Cell key={entry.stage} fill={STAGE_FILL[entry.stage]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
        Email open rate {openRate}% across {emails.sent} sent · open and click
        tracking is backend-dependent.
      </p>
    </div>
  )
}

export default PipelineByStageChart
