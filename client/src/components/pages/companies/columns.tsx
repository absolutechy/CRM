import type { ColumnDef } from "@tanstack/react-table"
import { Building2, MapPin, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { COMPANY_STATUS_BADGE } from "@/lib/crm"
import type { Company } from "@/types/crm"

interface ColumnOptions {
  contactCount: (companyId: string) => number
  onEdit: (company: Company) => void
  onDelete: (company: Company) => void
}

export const createCompanyColumns = ({
  contactCount,
  onEdit,
  onDelete,
}: ColumnOptions): ColumnDef<Company>[] => [
  {
    accessorKey: "name",
    header: "Company",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-100">
          <Building2 className="size-4 text-primary-700" />
        </span>
        <Link
          to={`/companies/${row.original.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-foreground hover:text-primary hover:underline"
        >
          {row.original.name}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "industry",
    header: "Industry",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.industry}</span>
    ),
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <MapPin className="size-3.5" />
        {row.original.location}
      </span>
    ),
  },
  {
    id: "contacts",
    accessorFn: (company) => contactCount(company.id),
    header: "Contacts",
    cell: ({ getValue }) => (
      <span className="tabular-nums text-foreground">{getValue<number>()}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={COMPANY_STATUS_BADGE[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    enableSorting: false,
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${row.original.name}`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/companies/${row.original.id}`}>
                <Building2 />
                View company
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(row.original)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onDelete(row.original)}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
]
