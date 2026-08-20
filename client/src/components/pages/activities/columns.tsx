import type { ColumnDef } from "@tanstack/react-table"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import {
  INTERACTION_META,
  formatDateTime,
  formatDuration,
} from "@/lib/crm"
import type { InteractionRow } from "@/store/selectors"

export const interactionColumns: ColumnDef<InteractionRow>[] = [
  {
    id: "type",
    accessorFn: (row) => INTERACTION_META[row.activity.type].label,
    header: "Type",
    cell: ({ row }) => {
      const { type, direction } = row.original.activity
      const meta = INTERACTION_META[type]
      const Icon = meta.icon
      return (
        <span className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-100">
            <Icon className="size-3.5 text-primary-700" />
          </span>
          <Badge variant={meta.badge} className="gap-1">
            {direction === "inbound" && <ArrowDownLeft className="size-3" />}
            {direction === "outbound" && <ArrowUpRight className="size-3" />}
            {meta.label}
          </Badge>
        </span>
      )
    },
    filterFn: (row, id, value: string) =>
      !value || row.getValue<string>(id) === value,
  },
  {
    id: "summary",
    accessorFn: (row) => row.activity.summary,
    header: "Summary",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">
          {row.original.activity.summary}
        </p>
        {row.original.activity.body && (
          <p className="truncate text-xs text-muted-foreground">
            {row.original.activity.body}
          </p>
        )}
      </div>
    ),
  },
  {
    id: "contact",
    accessorFn: (row) => row.contactName,
    header: "Contact",
    cell: ({ row, getValue }) => (
      <Link
        to={`/contacts/${row.original.activity.contactId}`}
        onClick={(e) => e.stopPropagation()}
        className="text-muted-foreground hover:text-primary hover:underline"
      >
        {getValue<string>()}
      </Link>
    ),
  },
  {
    id: "company",
    accessorFn: (row) => row.companyName,
    header: "Company",
    cell: ({ row, getValue }) =>
      row.original.activity.companyId ? (
        <Link
          to={`/companies/${row.original.activity.companyId}`}
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-primary hover:underline"
        >
          {getValue<string>()}
        </Link>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "actor",
    accessorFn: (row) => row.activity.actor,
    header: "Logged by",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue<string>()}</span>
    ),
  },
  {
    id: "when",
    accessorFn: (row) => row.activity.scheduledAt ?? row.activity.at,
    header: "When",
    cell: ({ row }) => {
      const { activity } = row.original
      const duration = formatDuration(activity.durationMinutes)
      return (
        <span className="flex items-center gap-2 whitespace-nowrap text-muted-foreground">
          {formatDateTime(activity.scheduledAt ?? activity.at)}
          {duration && <span className="text-xs">· {duration}</span>}
          {activity.status === "planned" && (
            <Badge variant="info">Scheduled</Badge>
          )}
        </span>
      )
    },
  },
]
