import { useEffect, useMemo, useState } from "react"
import { CheckCheck, Inbox, Sparkles, Trash2 } from "lucide-react"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import PageHeader from "@/components/common/PageHeader"
import ChangeRow from "@/components/pages/review/ChangeRow"
import PasteModal from "@/components/pages/review/PasteModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { usePermissions } from "@/hooks/usePermissions"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  approveExtraction,
  approveProposal,
  discardExtraction,
  extractProposals,
  fetchProposals,
  rejectProposal,
  selectIsExtracting,
  selectPendingByExtraction,
  selectProposalsStatus,
} from "@/store/proposalsSlice"
import type { ProposedChange } from "@/types/crm"

const Review = () => {
  const dispatch = useAppDispatch()
  const groups = useAppSelector(selectPendingByExtraction)
  const status = useAppSelector(selectProposalsStatus)
  const extracting = useAppSelector(selectIsExtracting)
  const { canWriteSharedRecords } = usePermissions()

  const [pasteOpen, setPasteOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchProposals({ status: "pending" }))
  }, [dispatch])

  /**
   * Mirrors canApplyChange on the server: contacts and activities are shared and
   * privileged, everything else is owner-scoped and the API decides. Getting
   * this wrong only costs a confusing 403, never a security hole.
   */
  const canApprove = useMemo(
    () => (change: ProposedChange) =>
      change.entity === "contact" || change.entity === "activity"
        ? canWriteSharedRecords
        : true,
    [canWriteSharedRecords]
  )

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleExtract = async (text: string, sourceLabel: string) => {
    const result = await dispatch(extractProposals({ text, sourceLabel }))
    if (extractProposals.fulfilled.match(result)) {
      setPasteOpen(false)
      dispatch(fetchProposals({ status: "pending" }))
    }
  }

  const handleApprove = async (id: string) => {
    setBusyId(id)
    try {
      await dispatch(approveProposal(id))
    } finally {
      setBusyId(null)
    }
  }

  const handleApproveAll = async (extractionId: string) => {
    await dispatch(approveExtraction(extractionId))
    dispatch(fetchProposals({ status: "pending" }))
  }

  const totalPending = groups.reduce((sum, g) => sum + g.changes.length, 0)

  return (
    <>
      <PageHeader>
        {totalPending > 0 && (
          <Badge variant="accent">{totalPending} awaiting review</Badge>
        )}
      </PageHeader>

      <MainContentWrapper className="space-y-6 px-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Paste a thread, transcript or note. Claude proposes the CRM changes;
            nothing is written until you approve it.
          </p>
          <Button onClick={() => setPasteOpen(true)}>
            <Sparkles />
            Paste something
          </Button>
        </div>

        {status === "loading" && groups.length === 0 ? (
          <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface py-16 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Inbox className="size-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium text-foreground">Nothing to review</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              After a call or an email thread, paste it here instead of filling in
              forms.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <section
              key={group.extractionId}
              className="overflow-hidden rounded-lg border border-border bg-surface"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {group.sourceLabel || "Pasted text"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {group.summary} · {group.changes.length} change
                    {group.changes.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch(discardExtraction(group.extractionId))}
                  >
                    <Trash2 />
                    Discard
                  </Button>
                  <Button size="sm" onClick={() => handleApproveAll(group.extractionId)}>
                    <CheckCheck />
                    Approve all
                  </Button>
                </div>
              </header>

              <ul>
                {group.changes.map((change) => (
                  <ChangeRow
                    key={change.id}
                    change={change}
                    selected={selected.has(change.id)}
                    onToggle={() => toggle(change.id)}
                    onApprove={() => handleApprove(change.id)}
                    onReject={() => dispatch(rejectProposal(change.id))}
                    busy={busyId === change.id}
                    canApprove={canApprove(change)}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </MainContentWrapper>

      <PasteModal
        isOpen={pasteOpen}
        isExtracting={extracting}
        onClose={() => setPasteOpen(false)}
        onExtract={handleExtract}
      />
    </>
  )
}

export default Review
