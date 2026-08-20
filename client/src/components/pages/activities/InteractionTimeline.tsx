import { useMemo, useState } from "react"
import { History } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDayLabel } from "@/components/pages/messages/utils"
import { INTERACTION_META } from "@/lib/crm"
import { useAppSelector } from "@/store/hooks"
import { selectContactEntities } from "@/store/contactsSlice"
import type { TimelineEntry } from "@/store/selectors"
import type { Activity } from "@/types/crm"
import { INTERACTION_TYPES } from "@/types/crm"

import InteractionItem from "./InteractionItem"

interface InteractionTimelineProps {
  entries: TimelineEntry[]
  /** Show which contact each entry belongs to (company rollup view). */
  showContact?: boolean
  onEdit?: (activity: Activity) => void
  onDelete?: (activity: Activity) => void
  title?: string
}

type TypeFilter = "all" | "messages" | (typeof INTERACTION_TYPES)[number]

const dayOf = (iso: string) => new Date(iso).toDateString()

const InteractionTimeline: React.FC<InteractionTimelineProps> = ({
  entries,
  showContact = false,
  onEdit,
  onDelete,
  title = "Interaction history",
}) => {
  const contacts = useAppSelector(selectContactEntities)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")

  const visible = useMemo(() => {
    if (typeFilter === "all") return entries
    if (typeFilter === "messages")
      return entries.filter((e) => e.kind === "message")
    return entries.filter(
      (e) => e.kind === "activity" && e.activity.type === typeFilter
    )
  }, [entries, typeFilter])

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as TypeFilter)}
        >
          <SelectTrigger className="w-40" aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activity</SelectItem>
            <SelectItem value="messages">Messages</SelectItem>
            {INTERACTION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {INTERACTION_META[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted">
            <History className="size-5 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium text-foreground">
            Nothing recorded yet
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Log a call, email, meeting or note to start building this history.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-4 before:w-px before:bg-border">
          {visible.map((entry, i) => {
            const prev = visible[i - 1]
            const showDay = !prev || dayOf(prev.at) !== dayOf(entry.at)
            const contactId =
              entry.kind === "activity"
                ? (entry.activity.contactId ?? undefined)
                : undefined

            return (
              <div key={entry.id} className="space-y-5">
                {showDay && (
                  <li className="relative -ml-0.5 flex list-none items-center gap-2 pt-1 first:pt-0">
                    <span className="z-10 rounded-full bg-surface py-0.5 pr-2 text-[11px] font-medium text-muted-foreground">
                      {formatDayLabel(entry.at)}
                    </span>
                  </li>
                )}
                <InteractionItem
                  entry={entry}
                  contactId={contactId}
                  contactName={
                    showContact && contactId
                      ? contacts[contactId]?.name
                      : undefined
                  }
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            )
          })}
        </ol>
      )}
    </section>
  )
}

export default InteractionTimeline
