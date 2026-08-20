import { useState } from "react"
import { CalendarClock, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { INTERACTION_META } from "@/lib/crm"
import { cn } from "@/lib/utils"
import type { ActivityDraft } from "@/store/activitiesSlice"
import type { ActivityDirection, InteractionType } from "@/types/crm"
import { INTERACTION_TYPES } from "@/types/crm"

interface InteractionComposerProps {
  /** Provide one of these — the interaction attaches to a contact or a lead. */
  contactId?: string | null
  leadId?: string | null
  companyId: string | null
  onLog: (draft: ActivityDraft) => void
  actor?: string
}

/** Types where duration and direction are meaningful. */
const HAS_DURATION: InteractionType[] = ["call", "meeting"]
const HAS_DIRECTION: InteractionType[] = ["call", "email", "inquiry"]

const InteractionComposer: React.FC<InteractionComposerProps> = ({
  contactId = null,
  leadId = null,
  companyId,
  onLog,
  actor = "John Doe",
}) => {
  const [type, setType] = useState<InteractionType>("note")
  const [summary, setSummary] = useState("")
  const [body, setBody] = useState("")
  const [direction, setDirection] = useState<ActivityDirection>("outbound")
  const [duration, setDuration] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")

  const showDuration = HAS_DURATION.includes(type)
  const showDirection = HAS_DIRECTION.includes(type)
  const canSchedule = type === "call" || type === "meeting"
  const isPlanned = canSchedule && scheduledAt !== ""

  const reset = () => {
    setSummary("")
    setBody("")
    setDuration("")
    setScheduledAt("")
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = summary.trim()
    if (!trimmed) return

    onLog({
      contactId,
      leadId,
      companyId,
      type,
      status: isPlanned ? "planned" : "logged",
      summary: trimmed,
      body: body.trim() || undefined,
      direction: showDirection ? direction : undefined,
      durationMinutes:
        showDuration && duration ? Number(duration) : undefined,
      scheduledAt: isPlanned ? new Date(scheduledAt).toISOString() : undefined,
      at: isPlanned ? new Date(scheduledAt).toISOString() : undefined,
      actor,
    })
    reset()
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-lg border border-border bg-surface p-5"
    >
      <h3 className="text-sm font-semibold text-foreground">
        Log an interaction
      </h3>

      {/* Type picker */}
      <div className="flex flex-wrap gap-1.5">
        {INTERACTION_TYPES.map((t) => {
          const meta = INTERACTION_META[t]
          const Icon = meta.icon
          const active = type === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-primary-200 bg-primary-100 text-primary-700"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {meta.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="interaction-summary">Summary *</Label>
        <Input
          id="interaction-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={
            type === "inquiry"
              ? "What did the customer ask about?"
              : "What happened?"
          }
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="interaction-body">Details</Label>
        <Textarea
          id="interaction-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Optional notes..."
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {showDirection && (
          <div className="space-y-1.5">
            <Label htmlFor="interaction-direction">Direction</Label>
            <Select
              value={direction}
              onValueChange={(v) => setDirection(v as ActivityDirection)}
            >
              <SelectTrigger id="interaction-direction" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outbound">Outbound — we reached out</SelectItem>
                <SelectItem value="inbound">Inbound — customer contacted us</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {showDuration && (
          <div className="space-y-1.5">
            <Label htmlFor="interaction-duration">Duration (min)</Label>
            <Input
              id="interaction-duration"
              type="number"
              min={0}
              step={5}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
            />
          </div>
        )}

        {canSchedule && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label
              htmlFor="interaction-scheduled"
              className="flex items-center gap-1.5"
            >
              <CalendarClock className="size-3.5" />
              Schedule for later
            </Label>
            <Input
              id="interaction-scheduled"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to log this as already happened.
            </p>
          </div>
        )}
      </div>

      <Button type="submit" size="sm" disabled={!summary.trim()}>
        <Plus />
        {isPlanned ? "Schedule" : "Add to timeline"}
      </Button>
    </form>
  )
}

export default InteractionComposer
