import { useCallback, useEffect, useMemo, useState } from "react"
import { LayoutGrid, List, Plus, UserPlus, UserX, Wallet } from "lucide-react"
import { useNavigate } from "react-router"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import PageHeader from "@/components/common/PageHeader"
import DataTable from "@/components/common/DataTable"
import StatCard from "@/components/pages/dashboard/StatCard"
import ConfirmDeleteModal from "@/components/pages/contacts/ConfirmDeleteModal"
import ConvertLeadModal, {
  type ConvertOptions,
} from "@/components/pages/leads/ConvertLeadModal"
import LeadFormModal from "@/components/pages/leads/LeadFormModal"
import LeadPipeline from "@/components/pages/leads/LeadPipeline"
import { createLeadColumns } from "@/components/pages/leads/columns"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL, formatCurrency } from "@/lib/crm"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  createLead,
  deleteLead,
  fetchLeads,
  selectAllLeads,
  selectLeadPipelineValue,
  selectLeadsStatus,
  updateLead,
} from "@/store/leadsSlice"
import { selectAllUsers, selectUserEntities } from "@/store/usersSlice"
import { useConvertLead } from "@/components/pages/leads/useConvertLead"
import type { Lead, LeadStatus } from "@/types/crm"
import { LEAD_SOURCES, LEAD_STATUSES } from "@/types/crm"
import { Spinner } from "@/components/ui/spinner"

type View = "list" | "pipeline"

const Leads = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const convertLead = useConvertLead()

  const leads = useAppSelector(selectAllLeads)
  const users = useAppSelector(selectAllUsers)
  const userEntities = useAppSelector(selectUserEntities)
  const pipelineValue = useAppSelector(selectLeadPipelineValue)
  const status = useAppSelector(selectLeadsStatus)

  const [view, setView] = useState<View>("list")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [ownerFilter, setOwnerFilter] = useState("all")

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [converting, setConverting] = useState<Lead | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Lead | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch leads whenever the filters change.
  useEffect(() => {
    dispatch(
      fetchLeads({
        ...(statusFilter !== "all" && { status: statusFilter as LeadStatus }),
        ...(sourceFilter !== "all" && { source: sourceFilter as Lead["source"] }),
        ...(ownerFilter !== "all" && {
          ownerId: ownerFilter === "unassigned" ? null : ownerFilter,
        }),
      })
    )
  }, [dispatch, statusFilter, sourceFilter, ownerFilter])

  const ownerName = useCallback(
    (ownerId: string | null) =>
      ownerId ? (userEntities[ownerId]?.name ?? "Unassigned") : "Unassigned",
    [userEntities]
  )

  const visible = useMemo(
    () =>
      leads.filter(
        (l) =>
          (statusFilter === "all" || l.status === statusFilter) &&
          (sourceFilter === "all" || l.source === sourceFilter) &&
          (ownerFilter === "all" ||
            (ownerFilter === "unassigned"
              ? !l.ownerId
              : l.ownerId === ownerFilter))
      ),
    [leads, statusFilter, sourceFilter, ownerFilter]
  )

  const columns = useMemo(
    () =>
      createLeadColumns({
        ownerName,
        onEdit: (lead) => {
          setEditing(lead)
          setFormOpen(true)
        },
        onConvert: setConverting,
        onDelete: setPendingDelete,
      }),
    [ownerName]
  )

  const handleSave = async (draft: Parameters<typeof createLead>[0]) => {
    setIsSaving(true)
    try {
      if (editing) {
        await dispatch(updateLead({ id: editing.id, changes: draft }))
      } else {
        await dispatch(createLead(draft))
      }
    } finally {
      setIsSaving(false)
      setFormOpen(false)
      setEditing(null)
    }
  }

  const handleConvert = async (lead: Lead, options: ConvertOptions) => {
    setIsConverting(true)
    try {
      const result = await convertLead(lead, options)
      if (result.contactId) {
        navigate(`/contacts/${result.contactId}`)
      }
    } finally {
      setIsConverting(false)
      setConverting(null)
    }
  }

  const unassigned = leads.filter((l) => !l.ownerId).length

  return (
    <>
      <PageHeader />
      <MainContentWrapper className="space-y-6 px-8">
        {/* Pipeline summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={UserPlus}
            title="Open leads"
            value={String(
              leads.filter(
                (l) => l.status !== "converted" && l.status !== "unqualified"
              ).length
            )}
            subtitle="Active pipeline"
            tone="default"
            sparkline={[10, 12, 11, 14, 13, 16, 15, 18, 17, 20, 22]}
          />
          <StatCard
            icon={Wallet}
            title="Pipeline value"
            value={formatCurrency(pipelineValue)}
            subtitle="Estimated value"
            tone="success"
            sparkline={[20, 24, 22, 28, 26, 30, 29, 34, 32, 38, 40]}
          />
          <StatCard
            icon={UserX}
            title="Unassigned"
            value={String(unassigned)}
            subtitle={unassigned > 0 ? "Needs an owner" : "All assigned"}
            tone={unassigned > 0 ? "warning" : "default"}
            sparkline={[5, 6, 5, 7, 6, 8, 7, 6, 5, 4, 3]}
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1 w-fit">
          {(["list", "pipeline"] as const).map((v) => (
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

        {status === "loading" && leads.length === 0 ? (
          <Spinner className="size-10" />
        ) : view === "list" ? (
          <DataTable
            columns={columns}
            data={visible}
            searchPlaceholder="Search leads, companies, emails..."
            onRowClick={(lead) => navigate(`/leads/${lead.id}`)}
            emptyMessage="No leads match these filters."
            toolbar={
              <div className="flex flex-wrap items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36" aria-label="Filter by status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {LEAD_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-36" aria-label="Filter by source">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    {LEAD_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {LEAD_SOURCE_LABEL[s]}
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
                New lead
              </Button>
            }
          />
        ) : (
          <LeadPipeline
            leads={visible}
            ownerName={ownerName}
            onStatusChange={(id, status: LeadStatus) =>
              dispatch(updateLead({ id, changes: { status } }))
            }
          />
        )}
      </MainContentWrapper>

      <LeadFormModal
        isOpen={formOpen}
        lead={editing}
        isLoading={isSaving}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />

      <ConvertLeadModal
        isOpen={!!converting}
        lead={converting}
        isLoading={isConverting}
        onClose={() => setConverting(null)}
        onConvert={handleConvert}
      />

      <ConfirmDeleteModal
        isOpen={!!pendingDelete}
        isLoading={isDeleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return
          setIsDeleting(true)
          try {
            await dispatch(deleteLead(pendingDelete.id))
          } finally {
            setIsDeleting(false)
            setPendingDelete(null)
          }
        }}
        title="Delete lead"
        description={`Delete ${pendingDelete?.name}? Their interaction history will be removed too.`}
      />
    </>
  )
}

export default Leads
