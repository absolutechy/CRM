import React, { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChartContainer } from "@/components/ui/chart"

interface MonthlyData {
  month: string
  rate: number
}

interface EmailOpenRateChartProps {
  title?: string
  data?: MonthlyData[]
  currentRate?: number
  changePercentage?: number
}

const chartConfig = {
  rate: {
    label: "Open Rate",
    color: "#d3d3d3",
  },
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: MonthlyData
  }>
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-lg">
        <p className="text-sm font-semibold text-gray-900">{data.month} 2023</p>
        <p className="text-sm text-gray-600">Open Rate: {data.rate}%</p>
      </div>
    )
  }
  return null
}

const EmailOpenRateChart: React.FC<EmailOpenRateChartProps> = ({
  title = "Average Email Open Rate",
  data = [
    { month: "Jan", rate: 45 },
    { month: "Feb", rate: 52 },
    { month: "Mar", rate: 48 },
    { month: "Apr", rate: 65 },
    { month: "May", rate: 58 },
    { month: "Jun", rate: 72 },
    { month: "Jul", rate: 85 },
    { month: "Aug", rate: 62 },
    { month: "Sep", rate: 78 },
    { month: "Oct", rate: 68 },
    { month: "Nov", rate: 74 },
    { month: "Dec", rate: 81 },
  ],
  currentRate = 64.23,
  changePercentage = 12,
}) => {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2">
      {/* Header with title and filters */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          <Select defaultValue="jan-dec-2023">
            <SelectTrigger className="h-7 w-40">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jan-dec-2023">
                January 2023 - December 2023
              </SelectItem>
              <SelectItem value="jan-dec-2024">
                January 2024 - December 2024
              </SelectItem>
              <SelectItem value="jan-dec-2025">
                January 2025 - December 2025
              </SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="monthly">
            <SelectTrigger className="h-7 w-24">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats section */}
      <div className="mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">
            {currentRate}%
          </span>
          <span className="text-xs text-green-600">↑ {changePercentage}%</span>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">Average Open Rate</p>
      </div>

      {/* Chart */}
      <ChartContainer
        config={chartConfig}
        className="w-full"
        style={{ height: "375px" }}
      >
        <ResponsiveContainer debounce={500}>
          <BarChart
            data={data}
            // isAnimationActive={false}
            margin={{ top: 5, right: 20, left: 0, bottom: 15 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="#9ca3af"
              style={{ fontSize: "10px" }}
              tick={{ fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
              height={20}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: "10px" }}
              tick={{ fill: "#6b7280" }}
              label={{
                value: "",
                angle: -90,
                position: "insideLeft",
                offset: 5,
                fontSize: 10,
              }}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              axisLine={{ stroke: "#e5e7eb" }}
              width={25}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar
              dataKey="rate"
              fill="#d3d3d3"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell
                  key={`cell-${entry.month}`}
                  fill={hoveredMonth === entry.month ? "#1f2937" : "#d3d3d3"}
                  onMouseEnter={() => setHoveredMonth(entry.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Footer info */}
      <div className="mt-1 border-t border-gray-200 pt-1">
        <p className="text-xs text-gray-500">
          Open Rate {currentRate}% on July 2023
        </p>
      </div>
    </div>
  )
}

export default EmailOpenRateChart
