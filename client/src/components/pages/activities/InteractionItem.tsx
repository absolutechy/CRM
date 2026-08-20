import { ArrowDownLeft, ArrowUpRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CHANNEL_META } from "@/components/pages/messages/utils"
import {
  INTERACTION_META,
  formatDateTime,
  formatDuration,
} from "@/lib/crm"
import { cn } from "@/lib/utils"
import type { TimelineEntry } from "@/store/selectors"
import type { Activity } from "@/types/crm"
import { isInteractionType } from "@/types/crm"

interface InteractionItemProps {
  entry: TimelineEntry
  /** Shown when the timeline spans multiple contacts (company rollup). */
  contactName?: string
  contactId?: string
  onEdit?: (activity: Activity) => void
  onDelete?: (activity: Activity) => void
}

const InteractionItem: React.FC<InteractionItemProps> = ({
  entry,
  contactName,
  contactId,
  onEdit,
  onDelete,
}) => {
  // ---- Message projection (read-only) ----
  if (entry.kind === "message") {
    const { message, channel } = entry
    const meta = CHANNEL_META[channel]
    const Icon = meta.icon
    const outbound = message.author === "me"

    return (
      <li className="relative flex gap-4">
        <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="text-sm font-medium text-foreground">
              {outbound ? "Message sent" : "Message received"}
            </p>
            <Badge variant="muted" className="gap-1">
              {outbound ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownLeft className="size-3" />
              )}
              {meta.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(entry.at)}
              {contactName && ` · ${contactName}`}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {message.body}
          </p>
        </div>
      </li>
    )
  }

  // ---- Logged activity ----
  const { activity } = entry
  const meta = INTERACTION_META[activity.type]
  const Icon = meta.icon
  const editable = isInteractionType(activity.type)
  const isPlanned = activity.status === "planned"
  const duration = formatDuration(activity.durationMinutes)

  return (
    <li className="group/item relative flex gap-4">
      <span
        className={cn(
          "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-surface",
          isPlanned ? "border-primary-200 bg-primary-50" : "border-border"
        )}
      >
        <Icon
          className={cn(
            "size-4",
            isPlanned ? "text-primary" : "text-primary-700"
          )}
        />
      </span>

      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="text-sm font-medium text-foreground">
            {activity.summary}
          </p>
          <Badge variant={meta.badge} className="gap-1">
            {activity.direction === "inbound" && (
              <ArrowDownLeft className="size-3" />
            )}
            {activity.direction === "outbound" && (
              <ArrowUpRight className="size-3" />
            )}
            {meta.label}
          </Badge>
          {isPlanned && <Badge variant="info">Scheduled</Badge>}
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDateTime(activity.scheduledAt ?? activity.at)}
          {duration && ` · ${duration}`}
          {` · ${activity.actor}`}
          {contactName && contactId && (
            <>
              {" · "}
              <Link
                to={`/contacts/${contactId}`}
                className="hover:text-primary hover:underline"
              >
                {contactName}
              </Link>
            </>
          )}
        </p>

        {activity.body && (
          <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
            {activity.body}
          </p>
        )}
      </div>

      {editable && (onEdit || onDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 transition-opacity group-hover/item:opacity-100 focus-visible:opacity-100"
              aria-label={`Actions for ${activity.summary}`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onSelect={() => onEdit(activity)}>
                <Pencil />
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(activity)}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  )
}

export default InteractionItem
