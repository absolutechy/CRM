import { useState } from "react"
import { ArrowRight, Check, ChevronDown, Quote, TriangleAlert, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { ProposalEntity, ProposedChange } from "@/types/crm"

const ENTITY_LABEL: Record<ProposalEntity, string> = {
  contact: "Contact",
  lead: "Lead",
  deal: "Deal",
  task: "Task",
  activity: "Activity",
}

interface ChangeRowProps {
  change: ProposedChange
  selected: boolean
  onToggle: () => void
  onApprove: () => void
  onReject: () => void
  busy?: boolean
  /** False when the viewer's role cannot apply this entity. */
  canApprove: boolean
}

/**
 * One proposed change, rendered as a diff. The old value sits left of an arrow
 * and the new value right of it — the same idiom ConvertLeadModal uses — so a
 * reviewer can scan a batch without reading prose.
 */
const ChangeRow = ({
  change,
  selected,
  onToggle,
  onApprove,
  onReject,
  busy = false,
  canApprove,
}: ChangeRowProps) => {
  const [showEvidence, setShowEvidence] = useState(false)
  const isCreate = change.action === "create_record" || change.action === "create_task"
  const needsTarget = !isCreate && !change.targetId

  return (
    <li className="border-b border-border last:border-b-0">
      <div className="flex items-start gap-3 p-4">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          disabled={!canApprove || needsTarget}
          aria-label={`Select ${change.label}`}
          className="mt-1"
        />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{ENTITY_LABEL[change.entity]}</Badge>
            <span className="text-sm font-medium text-foreground">{change.label}</span>
            {change.status === "failed" && <Badge variant="error">Failed</Badge>}
          </div>

          {/* The diff */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {isCreate ? (
              <Badge variant="success">New</Badge>
            ) : (
              <>
                <span className="text-muted-foreground line-through">
                  {change.currentValue || "empty"}
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </>
            )}
            <span className="font-medium text-primary">
              {change.proposedValue || "—"}
            </span>
          </div>

          {needsTarget && (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-warning-soft p-2.5 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-strong" />
              <span className="text-warning-strong">
                No matching record found. Create or link one first, then re-extract.
              </span>
            </div>
          )}

          {change.error && (
            <p className="text-sm text-destructive">{change.error}</p>
          )}

          {change.evidence && (
            <div>
              <button
                type="button"
                onClick={() => setShowEvidence((open) => !open)}
                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronDown
                  className={cn("size-3.5 transition-transform", showEvidence && "rotate-180")}
                />
                Evidence
              </button>
              {showEvidence && (
                <blockquote className="mt-1.5 flex gap-2 rounded-lg border border-border bg-muted p-2.5 text-sm text-muted-foreground">
                  <Quote className="size-3.5 shrink-0" />
                  <span className="italic">{change.evidence}</span>
                </blockquote>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="sm"
            onClick={onApprove}
            loading={busy}
            disabled={!canApprove || needsTarget}
            title={
              canApprove
                ? undefined
                : `Only admins and managers can apply ${change.entity} changes`
            }
          >
            <Check />
            Approve
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onReject} aria-label="Reject">
            <X />
          </Button>
        </div>
      </div>
    </li>
  )
}

export default ChangeRow
