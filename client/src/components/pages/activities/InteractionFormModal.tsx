import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { INTERACTION_META } from "@/lib/crm"
import type { Activity, InteractionType } from "@/types/crm"
import { INTERACTION_TYPES } from "@/types/crm"

interface InteractionFormModalProps {
  isOpen: boolean
  activity: Activity | null
  onClose: () => void
  onSave: (id: string, changes: Partial<Activity>) => void
}

/** `datetime-local` needs `YYYY-MM-DDTHH:mm` in local time, not an ISO string. */
const toLocalInput = (iso?: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const InteractionFormModal: React.FC<InteractionFormModalProps> = ({
  isOpen,
  activity,
  onClose,
  onSave,
}) => {
  const [summary, setSummary] = useState("")
  const [body, setBody] = useState("")
  const [type, setType] = useState<InteractionType>("note")
  const [duration, setDuration] = useState("")
  const [when, setWhen] = useState("")

  useEffect(() => {
    if (!isOpen || !activity) return
    setSummary(activity.summary)
    setBody(activity.body ?? "")
    setType(activity.type as InteractionType)
    setDuration(activity.durationMinutes ? String(activity.durationMinutes) : "")
    setWhen(toLocalInput(activity.scheduledAt ?? activity.at))
  }, [isOpen, activity])

  if (!activity) return null

  const isPlanned = activity.status === "planned"

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = summary.trim()
    if (!trimmed) return

    const iso = when ? new Date(when).toISOString() : activity.at
    onSave(activity.id, {
      summary: trimmed,
      body: body.trim() || undefined,
      type,
      durationMinutes: duration ? Number(duration) : undefined,
      at: iso,
      ...(isPlanned ? { scheduledAt: iso } : {}),
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit interaction"
      className="max-w-lg"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="edit-type">Type</Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as InteractionType)}
          >
            <SelectTrigger id="edit-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERACTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {INTERACTION_META[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-summary">Summary *</Label>
          <Input
            id="edit-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-body">Details</Label>
          <Textarea
            id="edit-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-when">
              {isPlanned ? "Scheduled for" : "When"}
            </Label>
            <Input
              id="edit-when"
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-duration">Duration (min)</Label>
            <Input
              id="edit-duration"
              type="number"
              min={0}
              step={5}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!summary.trim()}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default InteractionFormModal
