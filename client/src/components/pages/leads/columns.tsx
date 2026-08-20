import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowRightLeft,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react"
import { Link } from "react-router"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LEAD_SOURCE_LABEL,
  LEAD_STATUS_BADGE,
  LEAD_STATUS_LABEL,
  formatCurrency,
  getInitials,
} from "@/lib/crm"
import type { Lead } from "@/types/crm"

interface ColumnOptions {
  ownerName: (ownerId: string | null) => string
  onEdit: (lead: Lead) => void
  onConvert: (lead: Lead) => void
  onDelete: (lead: Lead) => void
}

export const createLeadColumns = ({
  ownerName,
  onEdit,
  onConvert,
  onDelete,
}: ColumnOptions): ColumnDef<Lead>[] => [
  {
    accessorKey: "name",
    header: "Lead",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">
            {getInitials(row.original.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <Link
            to={`/leads/${row.original.id}`}
            onClick={(e) => e.stopPropagation()}
            className="block truncate font-medium text-foreground hover:text-primary hover:underline"
          >
            {row.original.name}
          </Link>
          <span className="block truncate text-xs text-muted-foreground">
            {row.original.jobTitle}
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.companyName || "—"}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <a
        href={`mailto:${row.original.email}`}
        onClick={(e) => e.stopPropagation()}
        className="text-muted-foreground hover:text-primary hover:underline"
      >
        {row.original.email}
      </a>
    ),
  },
  {
    id: "source",
    accessorFn: (lead) => LEAD_SOURCE_LABEL[lead.source],
    header: "Source",
    cell: ({ getValue }) => (
      <Badge variant="muted">{getValue<string>()}</Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={LEAD_STATUS_BADGE[row.original.status]}>
        {LEAD_STATUS_LABEL[row.original.status]}
      </Badge>
    ),
  },
  {
    id: "owner",
    accessorFn: (lead) => ownerName(lead.ownerId),
    header: "Owner",
    cell: ({ getValue }) => {
      const name = getValue<string>()
      return (
        <span
          className={
            name === "Unassigned"
              ? "text-warning-strong"
              : "text-muted-foreground"
          }
        >
          {name}
        </span>
      )
    },
  },
  {
    id: "value",
    accessorFn: (lead) => lead.estimatedValue ?? 0,
    header: "Value",
    cell: ({ row }) => (
      <span className="tabular-nums text-foreground">
        {row.original.estimatedValue
          ? formatCurrency(row.original.estimatedValue)
          : "—"}
      </span>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    enableSorting: false,
    header: "",
    cell: ({ row }) => {
      const lead = row.original
      return (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${lead.name}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/leads/${lead.id}`}>
                  <UserRound />
                  View lead
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEdit(lead)}>
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onConvert(lead)}
                disabled={lead.status === "converted"}
              >
                <ArrowRightLeft />
                Convert to contact
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(lead)}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
