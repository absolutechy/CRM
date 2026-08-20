import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowRight, MessageCircle, Phone } from "lucide-react"
import { Link, useNavigate } from "react-router"

import DataTable from "@/components/common/DataTable"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CONTACT_STATUS_BADGE, getInitials } from "@/lib/crm"
import { useAppSelector } from "@/store/hooks"
import { selectCompanyEntities } from "@/store/companiesSlice"
import { selectAllContacts } from "@/store/contactsSlice"
import type { Contact } from "@/types/crm"

interface PeopleTableProps {
  title?: string
  /** How many rows to show before paginating. */
  pageSize?: number
}

/**
 * Dashboard widget. Reads the same canonical contacts as /contacts rather than
 * keeping its own copy, so phone numbers and companies can never drift.
 */
const PeopleTable: React.FC<PeopleTableProps> = ({
  title = "People",
  pageSize = 5,
}) => {
  const navigate = useNavigate()
  const contacts = useAppSelector(selectAllContacts)
  const companyEntities = useAppSelector(selectCompanyEntities)

  const columns = useMemo<ColumnDef<Contact>[]>(
    () => [
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
              className="text-sm font-medium text-foreground hover:text-primary hover:underline"
            >
              {row.original.name}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.email}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-muted-foreground">
            {row.original.phone || "—"}
          </span>
        ),
      },
      {
        id: "company",
        accessorFn: (c) =>
          c.companyId ? (companyEntities[c.companyId]?.name ?? "—") : "—",
        header: "Company",
        cell: ({ row, getValue }) =>
          row.original.companyId ? (
            <Link
              to={`/companies/${row.original.companyId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              {getValue<string>()}
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
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
      },
      {
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        header: "",
        cell: () => (
          <div
            className="flex justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="icon-sm" aria-label="Call">
              <Phone />
            </Button>
            <Button asChild variant="ghost" size="icon-sm" aria-label="Message">
              <Link to="/messages">
                <MessageCircle />
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [companyEntities]
  )

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <Button asChild variant="ghost" size="sm">
          <Link to="/contacts">
            View all
            <ArrowRight />
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={contacts}
        onRowClick={(contact) => navigate(`/contacts/${contact.id}`)}
        emptyMessage="No contacts yet."
        initialPageSize={pageSize}
      />
    </div>
  )
}

export default PeopleTable
