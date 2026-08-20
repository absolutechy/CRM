import React, { useMemo } from "react"
import { MapPin } from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { COMPANY_STATUS_BADGE } from "@/lib/crm"
import { useAppSelector } from "@/store/hooks"
import { selectAllCompanies } from "@/store/companiesSlice"
import { selectAllContacts } from "@/store/contactsSlice"

const SLICE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
]

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name?: string; value?: number }>
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-surface p-2 shadow-lg">
      <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
      <p className="text-sm text-muted-foreground">
        {payload[0].value} {payload[0].value === 1 ? "account" : "accounts"}
      </p>
    </div>
  )
}

/**
 * Accounts and their industry split, both read from the store. Previously this
 * rendered two hardcoded arrays that never matched the rest of the app.
 */
const CompaniesSection: React.FC<{ title?: string }> = ({
  title = "Companies",
}) => {
  const companies = useAppSelector(selectAllCompanies)
  const contacts = useAppSelector(selectAllContacts)

  const contactCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of contacts) {
      if (c.companyId) map.set(c.companyId, (map.get(c.companyId) ?? 0) + 1)
    }
    return map
  }, [contacts])

  // Industry breakdown, largest first, with a rolled-up "Other" tail.
  const categories = useMemo(() => {
    const byIndustry = new Map<string, number>()
    for (const c of companies) {
      const key = c.industry?.trim() || "Uncategorised"
      byIndustry.set(key, (byIndustry.get(key) ?? 0) + 1)
    }
    const sorted = [...byIndustry.entries()].sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, 5)
    const tail = sorted.slice(5).reduce((sum, [, n]) => sum + n, 0)
    if (tail > 0) top.push(["Other", tail])
    return top.map(([name, value], i) => ({
      name,
      value,
      percentage: companies.length
        ? Math.round((value / companies.length) * 100)
        : 0,
      color: SLICE_COLORS[i % SLICE_COLORS.length],
    }))
  }, [companies])

  const recent = companies.slice(0, 5)

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      {/* Accounts table */}
      <div className="flex-1 rounded-lg border border-border bg-surface p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <Button asChild variant="ghost" size="sm">
            <Link to="/companies">View all</Link>
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground">Company</TableHead>
              <TableHead className="text-muted-foreground">Industry</TableHead>
              <TableHead className="text-muted-foreground">Location</TableHead>
              <TableHead className="text-muted-foreground">Contacts</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((company) => (
              <TableRow key={company.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                      {company.name.charAt(0)}
                    </div>
                    <Link
                      to={`/companies/${company.id}`}
                      className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {company.name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {company.industry || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {company.location || "—"}
                  </div>
                </TableCell>
                <TableCell className="text-sm tabular-nums text-foreground">
                  {contactCounts.get(company.id) ?? 0}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={COMPANY_STATUS_BADGE[company.status]}
                    className="capitalize"
                  >
                    {company.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Industry split */}
      <div className="rounded-lg border border-border bg-surface p-6 xl:w-80">
        <h4 className="mb-4 text-sm font-semibold text-foreground">
          Accounts by industry
        </h4>

        <div className="relative">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={categories}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={92}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {categories.map((c) => (
                    <Cell key={c.name} fill={c.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {companies.length}
            </p>
            <p className="text-xs text-muted-foreground">Accounts</p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {categories.map((category) => (
            <div
              key={category.name}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="truncate font-medium text-foreground">
                  {category.name}
                </span>
              </div>
              <span className="tabular-nums text-muted-foreground">
                {category.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CompaniesSection
