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
import { LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL } from "@/lib/crm"
import { useAppSelector } from "@/store/hooks"
import { selectAllCampaigns } from "@/store/campaignsSlice"
import { selectAllUsers } from "@/store/usersSlice"
import type { LeadDraft } from "@/store/leadsSlice"
import type { Lead, LeadSource, LeadStatus } from "@/types/crm"
import { LEAD_SOURCES, LEAD_STATUSES } from "@/types/crm"

interface LeadFormModalProps {
  isOpen: boolean
  lead?: Lead | null
  isLoading?: boolean
  onClose: () => void
  onSave: (draft: LeadDraft) => void
}

const emptyDraft = (): LeadDraft => ({
  name: "",
  jobTitle: "",
  email: "",
  phone: "",
  companyName: "",
  source: "web",
  status: "new",
  ownerId: null,
  estimatedValue: undefined,
  notes: "",
  campaignId: null,
})

const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  lead,
  isLoading = false,
  onClose,
  onSave,
}) => {
  const users = useAppSelector(selectAllUsers)
  const campaigns = useAppSelector(selectAllCampaigns)
  const [draft, setDraft] = useState<LeadDraft>(emptyDraft)

  useEffect(() => {
    if (!isOpen) return
    if (lead) {
      const {
        id: _id,
        createdAt: _c,
        updatedAt: _u,
        convertedContactId: _cc,
        convertedCompanyId: _cco,
        ...rest
      } = lead
      setDraft(rest)
    } else {
      setDraft(emptyDraft())
    }
  }, [isOpen, lead])

  const set = <K extends keyof LeadDraft>(key: K, value: LeadDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())
  const canSave = draft.name.trim().length > 0 && emailValid

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead ? "Edit lead" : "New lead"}
      className="max-w-2xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (canSave)
            onSave({
              ...draft,
              name: draft.name.trim(),
              email: draft.email.trim(),
            })
        }}
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="lead-name">Name *</Label>
            <Input
              id="lead-name"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Jane Cooper"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-title">Job title</Label>
            <Input
              id="lead-title"
              value={draft.jobTitle}
              onChange={(e) => set("jobTitle", e.target.value)}
              placeholder="Head of Operations"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-email">Email *</Label>
            <Input
              id="lead-email"
              type="email"
              value={draft.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="jane@company.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-phone">Phone</Label>
            <Input
              id="lead-phone"
              value={draft.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(555) 555-0100"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="lead-company">Company</Label>
            <Input
              id="lead-company"
              value={draft.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              placeholder="Northwind Traders"
            />
            <p className="text-xs text-muted-foreground">
              Becomes a real account record when the lead is converted.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="lead-source">Source</Label>
            <Select
              value={draft.source}
              onValueChange={(v) => set("source", v as LeadSource)}
            >
              <SelectTrigger id="lead-source" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {LEAD_SOURCE_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-status">Status</Label>
            <Select
              value={draft.status}
              onValueChange={(v) => set("status", v as LeadStatus)}
            >
              <SelectTrigger id="lead-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {LEAD_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-owner">Assigned to</Label>
            <Select
              value={draft.ownerId ?? "none"}
              onValueChange={(v) => set("ownerId", v === "none" ? null : v)}
            >
              <SelectTrigger id="lead-owner" className="w-full">
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
            <Label htmlFor="lead-value">Estimated value</Label>
            <Input
              id="lead-value"
              type="number"
              min={0}
              step={500}
              value={draft.estimatedValue ?? ""}
              onChange={(e) =>
                set(
                  "estimatedValue",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder="25000"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="lead-campaign">Source campaign</Label>
            <Select
              value={draft.campaignId ?? "none"}
              onValueChange={(v) => set("campaignId", v === "none" ? null : v)}
            >
              <SelectTrigger id="lead-campaign" className="w-full">
                <SelectValue placeholder="No campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No campaign</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lead-notes">Notes</Label>
          <Textarea
            id="lead-notes"
            value={draft.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            placeholder="Context, qualification detail, next steps..."
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave} loading={isLoading}>
            {lead ? "Save changes" : "Create lead"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default LeadFormModal
