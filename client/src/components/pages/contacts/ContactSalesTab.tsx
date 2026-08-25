import { Receipt, TrendingUp, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import StatCard from "@/components/pages/dashboard/StatCard"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { STAGE_BADGE, formatCurrency, formatDate } from "@/lib/crm"
import { useAppSelector } from "@/store/hooks"
import { selectDealsByContactId } from "@/store/dealsSlice"
import { isOpenStage } from "@/types/crm"

interface ContactSalesTabProps {
  contactId: string
}

const ContactSalesTab: React.FC<ContactSalesTabProps> = ({ contactId }) => {
  const deals = useAppSelector((s) => selectDealsByContactId(s, contactId))

  const currency = deals[0]?.currency ?? "USD"
  const wonValue = deals
    .filter((d) => d.stage === "Won")
    .reduce((sum, d) => sum + d.amount, 0)
  const openValue = deals
    .filter((d) => isOpenStage(d.stage))
    .reduce((sum, d) => sum + d.amount, 0)
  const latestStage = deals[0]?.stage

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Trophy}
          title="Closed won"
          value={formatCurrency(wonValue, currency)}
          subtitle="Won deals value"
          tone="success"
          sparkline={[5, 6, 8, 7, 9, 10, 12, 11, 13, 14, 16]}
        />
        <StatCard
          icon={TrendingUp}
          title="Open pipeline"
          value={formatCurrency(openValue, currency)}
          subtitle="Active deals value"
          tone="default"
          sparkline={[14, 16, 15, 19, 18, 22, 21, 25, 24, 27, 29]}
        />
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-xs text-muted-foreground">Current stage</p>
          <p className="mt-2">
            {latestStage ? (
              <Badge variant={STAGE_BADGE[latestStage]}>{latestStage}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </p>
        </div>
      </div>

      {/* Deals */}
      <section className="rounded-lg border border-border bg-surface">
        <h3 className="border-b border-border p-5 text-sm font-semibold text-foreground">
          Purchase history
        </h3>

        {deals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Receipt className="size-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium text-foreground">
              No deals recorded
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Deals for this contact will appear here. Won deals double as
              their purchase history.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Closed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-foreground">
                    {order.title}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {order.reference}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums text-foreground">
                    {formatCurrency(order.amount, order.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STAGE_BADGE[order.stage]}>
                      {order.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.closedAt ? formatDate(order.closedAt) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}

export default ContactSalesTab
