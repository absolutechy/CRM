import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, UserRound } from "lucide-react"
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
import { CONTACT_STATUS_BADGE, getInitials } from "@/lib/crm"
import type { Contact } from "@/types/crm"

interface ColumnOptions {
  companyName: (companyId: string | null) => string
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
}

export const createContactColumns = ({
  companyName,
  onEdit,
  onDelete,
}: ColumnOptions): ColumnDef<Contact>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">
            {getInitials(row.original.name)}
          </AvatarFallback>
        </Avatar>
        <Link
          to={`/contacts/${row.original.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-foreground hover:text-primary hover:underline"
        >
          {row.original.name}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "jobTitle",
    header: "Job title",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.jobTitle || "—"}
      </span>
    ),
  },
  {
    // Derived so global search and sorting work on the resolved company name
    // rather than the raw FK.
    id: "company",
    accessorFn: (contact) => companyName(contact.companyId),
    header: "Company",
    cell: ({ row, getValue }) =>
      row.original.companyId ? (
        <Link
          to={`/companies/${row.original.companyId}`}
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
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.original.phone || "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={CONTACT_STATUS_BADGE[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) =>
      value.length === 0 || value.includes(row.getValue<string>(id)),
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
              <Link to={`/contacts/${row.original.id}`}>
                <UserRound />
                View profile
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
