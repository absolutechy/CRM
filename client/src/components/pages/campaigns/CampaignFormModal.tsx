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
import { CAMPAIGN_TYPE_LABEL } from "@/lib/crm"
import { useAppSelector } from "@/store/hooks"
import { selectAllTemplates } from "@/store/emailSlice"
import { selectAllUsers } from "@/store/usersSlice"
import type { CampaignDraft } from "@/store/campaignsSlice"
import type { Campaign, CampaignStatus, CampaignType } from "@/types/crm"
import { CAMPAIGN_STATUSES, CAMPAIGN_TYPES } from "@/types/crm"

interface CampaignFormModalProps {
  isOpen: boolean
  campaign?: Campaign | null
  onClose: () => void
  onSave: (draft: CampaignDraft) => void
}

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "")

const emptyDraft = (): CampaignDraft => ({
  name: "",
  type: "email",
  status: "draft",
  startDate: new Date().toISOString(),
  endDate: undefined,
  goal: "",
  budget: undefined,
  ownerId: null,
  templateId: null,
})

const CampaignFormModal: React.FC<CampaignFormModalProps> = ({
  isOpen,
  campaign,
  onClose,
  onSave,
}) => {
  const users = useAppSelector(selectAllUsers)
  const templates = useAppSelector(selectAllTemplates)
  const [draft, setDraft] = useState<CampaignDraft>(emptyDraft)

  useEffect(() => {
    if (!isOpen) return
    if (campaign) {
      const { id: _id, createdAt: _c, ...rest } = campaign
      setDraft(rest)
    } else {
      setDraft(emptyDraft())
    }
  }, [isOpen, campaign])

  const set = <K extends keyof CampaignDraft>(
    key: K,
    value: CampaignDraft[K]
  ) => setDraft((d) => ({ ...d, [key]: value }))

  const canSave = draft.name.trim().length > 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={campaign ? "Edit campaign" : "New campaign"}
      className="max-w-2xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (canSave) onSave({ ...draft, name: draft.name.trim() })
        }}
        className="space-y-5"
      >
        <div className="space-y-1.5">
          <Label htmlFor="camp-name">Name *</Label>
          <Input
            id="camp-name"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Q3 Inbound Nurture"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="camp-type">Type</Label>
            <Select
              value={draft.type}
              onValueChange={(v) => set("type", v as CampaignType)}
            >
              <SelectTrigger id="camp-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAMPAIGN_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {CAMPAIGN_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camp-status">Status</Label>
            <Select
              value={draft.status}
              onValueChange={(v) => set("status", v as CampaignStatus)}
            >
              <SelectTrigger id="camp-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAMPAIGN_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camp-start">Start date</Label>
            <Input
              id="camp-start"
              type="date"
              value={toDateInput(draft.startDate)}
              onChange={(e) =>
                set("startDate", new Date(e.target.value).toISOString())
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camp-end">End date</Label>
            <Input
              id="camp-end"
              type="date"
              value={toDateInput(draft.endDate)}
              onChange={(e) =>
                set(
                  "endDate",
                  e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined
                )
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camp-owner">Owner</Label>
            <Select
              value={draft.ownerId ?? "none"}
              onValueChange={(v) => set("ownerId", v === "none" ? null : v)}
            >
              <SelectTrigger id="camp-owner" className="w-full">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camp-budget">Budget</Label>
            <Input
              id="camp-budget"
              type="number"
              min={0}
              step={500}
              value={draft.budget ?? ""}
              onChange={(e) =>
                set("budget", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="5000"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="camp-template">Email template</Label>
            <Select
              value={draft.templateId ?? "none"}
              onValueChange={(v) => set("templateId", v === "none" ? null : v)}
            >
              <SelectTrigger id="camp-template" className="w-full">
                <SelectValue placeholder="No template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="camp-goal">Goal</Label>
          <Textarea
            id="camp-goal"
            value={draft.goal ?? ""}
            onChange={(e) => set("goal", e.target.value)}
            rows={2}
            placeholder="Convert 20 inbound signups to qualified leads"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave}>
            {campaign ? "Save changes" : "Create campaign"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CampaignFormModal
