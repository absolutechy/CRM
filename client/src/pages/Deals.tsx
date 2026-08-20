import { useCallback, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { Link } from "react-router"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import PageHeader from "@/components/common/PageHeader"
import DataTable from "@/components/common/DataTable"
import ConfirmDeleteModal from "@/components/pages/contacts/ConfirmDeleteModal"
import DealFormModal from "@/components/pages/deals/DealFormModal"
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
import { STAGE_BADGE, formatCurrency, formatDate } from "@/lib/crm"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectCompanyEntities } from "@/store/companiesSlice"
import { selectContactEntities } from "@/store/contactsSlice"
import {
  dealAdded,
  dealRemoved,
  dealStageChanged,
  dealUpdated,
  selectAllDeals,
  selectPipelineSummary,
  type DealDraft,
} from "@/store/dealsSlice"
import { selectAllUsers, selectUserEntities } from "@/store/usersSlice"
import type { Deal, DealStage } from "@/types/crm"
import { DEAL_STAGES } from "@/types/crm"

type View = "list" | "pipeline"

const Deals = () => {
  const dispatch = useAppDispatch()

  const deals = useAppSelector(selectAllDeals)
  const summary = useAppSelector(selectPipelineSummary)
  const contacts = useAppSelector(selectContactEntities)
  const companies = useAppSelector(selectCompanyEntities)
  const users = useAppSelector(selectAllUsers)
  const userEntities = useAppSelector(selectUserEntities)

  const [view, setView] = useState<View>("pipeline")
  const [stageFilter, setStageFilter] = useState("all")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Deal | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Deal | null>(null)

  const ownerName = useCallback(
    (id: string | null) =>
      id ? (userEntities[id]?.name ?? "Unassigned") : "Unassigned",
    [userEntities]
  )

  const visible = useMemo(
    () =>
      deals.filter(
        (d) =>
          (stageFilter === "all" || d.stage === stageFilter) &&
          (ownerFilter === "all" ||
            (ownerFilter === "unassigned"
              ? !d.ownerId
              : d.ownerId === ownerFilter))
      ),
    [deals, stageFilter, ownerFilter]
  )

  const openEdit = (deal: Deal) => {
    setEditing(deal)
    setFormOpen(true)
  }

  const columns = useMemo<ColumnDef<Deal>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Deal",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {row.original.title}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.reference}
            </p>
          </div>
        ),
      },
      {
        id: "account",
        accessorFn: (d) =>
          d.companyId ? (companies[d.companyId]?.name ?? "") : "",
        header: "Account",
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
        id: "contact",
        accessorFn: (d) =>
          d.contactId ? (contacts[d.contactId]?.name ?? "") : "",
        header: "Contact",
        cell: ({ row, getValue }) =>
          row.original.contactId ? (
            <Link
              to={`/contacts/${row.original.contactId}`}
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
        accessorKey: "amount",
        header: "Value",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums text-foreground">
            {formatCurrency(row.original.amount, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "stage",
        header: "Stage",
        cell: ({ row }) => (
          <Badge variant={STAGE_BADGE[row.original.stage]}>
            {row.original.stage}
          </Badge>
        ),
      },
      {
        accessorKey: "probability",
        header: "Win %",
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.probability}%
          </span>
        ),
      },
      {
        id: "owner",
        accessorFn: (d) => ownerName(d.ownerId),
        header: "Owner",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: "close",
        accessorFn: (d) => d.expectedCloseDate ?? d.closedAt ?? "",
        header: "Close date",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.closedAt
              ? formatDate(row.original.closedAt)
              : row.original.expectedCloseDate
                ? formatDate(row.original.expectedCloseDate)
                : "—"}
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
                  aria-label={`Actions for ${row.original.title}`}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => openEdit(row.original)}>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companies, contacts, ownerName]
  )

  const byStage = (stage: DealStage) => visible.filter((d) => d.stage === stage)

  return (
    <>
      <PageHeader />
      <MainContentWrapper className="space-y-6 px-8">
        {/* Pipeline summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="text-xs text-muted-foreground">Open pipeline</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {formatCurrency(summary.openValue, summary.currency)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="text-xs text-muted-foreground">Weighted forecast</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {formatCurrency(summary.weightedValue, summary.currency)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="text-xs text-muted-foreground">Closed won</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {formatCurrency(summary.wonValue, summary.currency)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="text-xs text-muted-foreground">Win rate</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {summary.winRate}%
            </p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-fit items-center gap-1 rounded-md border border-border bg-surface p-1">
            {(["pipeline", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn(
                  "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  view === v
                    ? "bg-primary-100 text-primary-700"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v === "list" ? (
                  <List className="size-4" />
                ) : (
                  <LayoutGrid className="size-4" />
                )}
                {v}
              </button>
            ))}
          </div>

          {view === "pipeline" && (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus />
              New deal
            </Button>
          )}
        </div>

        {view === "list" ? (
          <DataTable
            columns={columns}
            data={visible}
            searchPlaceholder="Search deals, accounts, contacts..."
            onRowClick={openEdit}
            emptyMessage="No deals match these filters."
            toolbar={
              <div className="flex items-center gap-2">
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-36" aria-label="Filter by stage">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {DEAL_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                  <SelectTrigger className="w-40" aria-label="Filter by owner">
                    <SelectValue placeholder="Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All owners</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
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
                New deal
              </Button>
            }
          />
        ) : (
          /* Stage board — native HTML5 DnD, matching Tasks and Leads */
          <div className="flex gap-4 overflow-x-auto pb-2">
            {DEAL_STAGES.map((stage) => {
              const items = byStage(stage)
              const total = items.reduce((sum, d) => sum + d.amount, 0)
              return (
                <section
                  key={stage}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const id = e.dataTransfer.getData("text/plain")
                    if (id) dispatch(dealStageChanged({ id, stage }))
                  }}
                  className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-surface"
                >
                  <header className="flex items-center justify-between border-b border-border p-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {stage}
                      </h3>
                      <Badge variant="muted">{items.length}</Badge>
                    </div>
                    {total > 0 && (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatCurrency(total)}
                      </span>
                    )}
                  </header>

                  <div className="flex-1 space-y-2 p-2">
                    {items.length === 0 ? (
                      <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                        Drop deals here
                      </p>
                    ) : (
                      items.map((deal) => (
                        <article
                          key={deal.id}
                          draggable
                          onDragStart={(e) =>
                            e.dataTransfer.setData("text/plain", deal.id)
                          }
                          onClick={() => openEdit(deal)}
                          className="cursor-grab rounded-md border border-border bg-surface p-3 transition-colors hover:bg-accent/60 active:cursor-grabbing"
                        >
                          <p className="truncate text-sm font-medium text-foreground">
                            {deal.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {deal.companyId
                              ? (companies[deal.companyId]?.name ?? "—")
                              : "No account"}
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold tabular-nums text-foreground">
                              {formatCurrency(deal.amount, deal.currency)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {deal.probability}%
                            </span>
                          </div>
                          <p className="mt-1 truncate text-[11px] text-muted-foreground">
                            {ownerName(deal.ownerId)}
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </MainContentWrapper>

      <DealFormModal
        isOpen={formOpen}
        deal={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSave={(draft: DealDraft) => {
          if (editing) {
            dispatch(dealUpdated({ id: editing.id, changes: draft }))
          } else {
            dispatch(dealAdded(draft))
          }
          setFormOpen(false)
          setEditing(null)
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) dispatch(dealRemoved(pendingDelete.id))
        }}
        title="Delete deal"
        description={`Delete "${pendingDelete?.title}"? This cannot be undone.`}
      />
    </>
  )
}

export default Deals
