import { useMemo, useState } from "react"
import { Link } from "react-router"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  LEAD_SOURCE_LABEL,
  LEAD_STATUS_LABEL,
  formatCurrency,
  getInitials,
} from "@/lib/crm"
import { cn } from "@/lib/utils"
import type { Lead, LeadStatus } from "@/types/crm"
import { LEAD_STATUSES } from "@/types/crm"

interface LeadPipelineProps {
  leads: Lead[]
  ownerName: (ownerId: string | null) => string
  onStatusChange: (leadId: string, status: LeadStatus) => void
}

/**
 * Status board using native HTML5 drag-and-drop, matching the existing Tasks
 * kanban rather than introducing a DnD library.
 */
const LeadPipeline: React.FC<LeadPipelineProps> = ({
  leads,
  ownerName,
  onStatusChange,
}) => {
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null)

  const columns = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = {
      new: [],
      contacted: [],
      qualified: [],
      unqualified: [],
      converted: [],
    }
    for (const lead of leads) grouped[lead.status].push(lead)
    return grouped
  }, [leads])

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {LEAD_STATUSES.map((status) => {
        const items = columns[status]
        const total = items.reduce((sum, l) => sum + (l.estimatedValue ?? 0), 0)

        return (
          <section
            key={status}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(status)
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(null)
              const id = e.dataTransfer.getData("text/plain")
              if (id) onStatusChange(id, status)
            }}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-lg border bg-surface transition-colors",
              dragOver === status
                ? "border-primary-200 bg-primary-50"
                : "border-border"
            )}
          >
            <header className="flex items-center justify-between border-b border-border p-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {LEAD_STATUS_LABEL[status]}
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
                  Drop leads here
                </p>
              ) : (
                items.map((lead) => (
                  <article
                    key={lead.id}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", lead.id)
                    }
                    className="cursor-grab rounded-md border border-border bg-surface p-3 transition-colors hover:bg-accent/60 active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(lead.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="block truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {lead.name}
                        </Link>
                        <span className="block truncate text-xs text-muted-foreground">
                          {lead.companyName || lead.jobTitle}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Badge variant="muted" className="text-[10px]">
                        {LEAD_SOURCE_LABEL[lead.source]}
                      </Badge>
                      {lead.estimatedValue ? (
                        <span className="text-xs font-medium tabular-nums text-foreground">
                          {formatCurrency(lead.estimatedValue)}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
                      {ownerName(lead.ownerId)}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default LeadPipeline
