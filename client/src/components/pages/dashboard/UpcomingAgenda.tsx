import { CalendarClock } from "lucide-react"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { INTERACTION_META, formatDuration } from "@/lib/crm"
import { formatDayLabel, formatTime } from "@/components/pages/messages/utils"
import { useAppSelector } from "@/store/hooks"
import { selectUpcomingInteractions } from "@/store/selectors"

interface UpcomingAgendaProps {
  /** How many upcoming items to show. */
  limit?: number
}

/**
 * Real scheduled interactions from the activities store — replaces the
 * hardcoded agenda this widget used to render.
 */
const UpcomingAgenda: React.FC<UpcomingAgendaProps> = ({ limit = 4 }) => {
  const upcoming = useAppSelector(selectUpcomingInteractions)
  const items = upcoming.slice(0, limit)

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Upcoming Agenda
        </h3>
        <Button asChild variant="ghost" size="sm">
          <Link to="/activities">View all</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted">
            <CalendarClock className="size-5 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium text-foreground">Nothing scheduled</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Schedule a call or meeting from a contact's Activity tab and it will
            appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(({ activity, contactName }) => {
            const meta = INTERACTION_META[activity.type]
            const Icon = meta.icon
            const when = activity.scheduledAt ?? activity.at
            const duration = formatDuration(activity.durationMinutes)

            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="rounded-full bg-primary-100 p-2">
                  <Icon className="h-4 w-4 text-primary-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/contacts/${activity.contactId}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {activity.summary}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">
                    {contactName}
                    {activity.body && ` — ${activity.body}`}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDayLabel(when)} · {formatTime(when)}
                      {duration && ` · ${duration}`}
                    </span>
                    <Badge variant={meta.badge}>{meta.label}</Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default UpcomingAgenda
