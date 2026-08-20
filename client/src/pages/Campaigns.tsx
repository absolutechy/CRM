import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Megaphone, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { Link, useNavigate } from "react-router"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import PageHeader from "@/components/common/PageHeader"
import DataTable from "@/components/common/DataTable"
import ConfirmDeleteModal from "@/components/pages/contacts/ConfirmDeleteModal"
import CampaignFormModal from "@/components/pages/campaigns/CampaignFormModal"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CAMPAIGN_STATUS_BADGE,
  CAMPAIGN_TYPE_LABEL,
  formatCurrency,
  formatDate,
} from "@/lib/crm"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  campaignAdded,
  campaignRemoved,
  campaignUpdated,
  selectAllCampaigns,
  selectMemberCounts,
  type CampaignDraft,
} from "@/store/campaignsSlice"
import { selectUserEntities } from "@/store/usersSlice"
import type { Campaign } from "@/types/crm"
import { CAMPAIGN_STATUSES, CAMPAIGN_TYPES } from "@/types/crm"

const Campaigns = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const campaigns = useAppSelector(selectAllCampaigns)
  const memberCounts = useAppSelector(selectMemberCounts)
  const users = useAppSelector(selectUserEntities)

  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Campaign | null>(null)

  const visible = useMemo(
    () =>
      campaigns.filter(
        (c) =>
          (statusFilter === "all" || c.status === statusFilter) &&
          (typeFilter === "all" || c.type === typeFilter)
      ),
    [campaigns, statusFilter, typeFilter]
  )

  const columns = useMemo<ColumnDef<Campaign>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Campaign",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-100">
              <Megaphone className="size-4 text-primary-700" />
            </span>
            <div className="min-w-0">
              <Link
                to={`/campaigns/${row.original.id}`}
                onClick={(e) => e.stopPropagation()}
                className="block truncate font-medium text-foreground hover:text-primary hover:underline"
              >
                {row.original.name}
              </Link>
              <span className="block truncate text-xs text-muted-foreground">
                {row.original.goal || "No goal set"}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "type",
        accessorFn: (c) => CAMPAIGN_TYPE_LABEL[c.type],
        header: "Type",
        cell: ({ getValue }) => <Badge variant="muted">{getValue<string>()}</Badge>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={CAMPAIGN_STATUS_BADGE[row.original.status]}
            className="capitalize"
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "members",
        accessorFn: (c) => memberCounts[c.id] ?? 0,
        header: "Audience",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-foreground">
            {getValue<number>()}
          </span>
        ),
      },
      {
        id: "owner",
        accessorFn: (c) => (c.ownerId ? (users[c.ownerId]?.name ?? "—") : "—"),
        header: "Owner",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: "dates",
        accessorFn: (c) => c.startDate,
        header: "Runs",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDate(row.original.startDate)}
            {row.original.endDate && ` → ${formatDate(row.original.endDate)}`}
          </span>
        ),
      },
      {
        id: "budget",
        accessorFn: (c) => c.budget ?? 0,
        header: "Budget",
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.budget ? formatCurrency(row.original.budget) : "—"}
          </span>
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
                  <Link to={`/campaigns/${row.original.id}`}>
                    <Megaphone />
                    View campaign
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setEditing(row.original)
                    setFormOpen(true)
                  }}
                >
                  <Pencil />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setPendingDelete(row.original)}
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [memberCounts, users]
  )

  return (
    <>
      <PageHeader />
      <MainContentWrapper className="space-y-6 px-8">
        <DataTable
          columns={columns}
          data={visible}
          searchPlaceholder="Search campaigns..."
          onRowClick={(c) => navigate(`/campaigns/${c.id}`)}
          emptyMessage="No campaigns match these filters."
          toolbar={
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36" aria-label="Filter by status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {CAMPAIGN_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36" aria-label="Filter by type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {CAMPAIGN_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {CAMPAIGN_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          actions={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus />
              New campaign
            </Button>
          }
        />
      </MainContentWrapper>

      <CampaignFormModal
        isOpen={formOpen}
        campaign={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSave={(draft: CampaignDraft) => {
          if (editing) {
            dispatch(campaignUpdated({ id: editing.id, changes: draft }))
          } else {
            dispatch(campaignAdded(draft))
          }
          setFormOpen(false)
          setEditing(null)
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) dispatch(campaignRemoved(pendingDelete.id))
        }}
        title="Delete campaign"
        description={`Delete "${pendingDelete?.name}"? Its audience membership will be removed too.`}
      />
    </>
  )
}

export default Campaigns
