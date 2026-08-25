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
import { useAppSelector } from "@/store/hooks"
import { selectAllCompanies } from "@/store/companiesSlice"
import { selectAllContacts } from "@/store/contactsSlice"
import { selectAllUsers } from "@/store/usersSlice"
import type { DealDraft } from "@/store/dealsSlice"
import type { Deal, DealStage } from "@/types/crm"
import { DEAL_STAGES, STAGE_PROBABILITY } from "@/types/crm"

interface DealFormModalProps {
  isOpen: boolean
  deal?: Deal | null
  onClose: () => void
  onSave: (draft: DealDraft) => void
  isLoading?: boolean
}

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "")

const emptyDraft = (): DealDraft => ({
  title: "",
  reference: `DEAL-${Math.floor(1000 + Math.random() * 9000)}`,
  contactId: null,
  companyId: null,
  ownerId: null,
  amount: 0,
  currency: "USD",
  stage: "New",
  probability: STAGE_PROBABILITY.New,
  expectedCloseDate: undefined,
  notes: "",
})

const DealFormModal: React.FC<DealFormModalProps> = ({
  isOpen,
  deal,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const contacts = useAppSelector(selectAllContacts)
  const companies = useAppSelector(selectAllCompanies)
  const users = useAppSelector(selectAllUsers)
  const [draft, setDraft] = useState<DealDraft>(emptyDraft)

  useEffect(() => {
    if (!isOpen) return
    if (deal) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = deal
      setDraft(rest)
    } else {
      setDraft(emptyDraft())
    }
  }, [isOpen, deal])

  const set = <K extends keyof DealDraft>(key: K, value: DealDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  /** Changing stage re-suggests the default probability for that stage. */
  const setStage = (stage: DealStage) =>
    setDraft((d) => ({ ...d, stage, probability: STAGE_PROBABILITY[stage] }))

  const canSave = draft.title.trim().length > 0 && draft.amount >= 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={deal ? "Edit deal" : "New deal"}
      className="max-w-2xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (canSave) onSave({ ...draft, title: draft.title.trim() })
        }}
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="deal-title">Title *</Label>
            <Input
              id="deal-title"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Acme platform rollout"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deal-amount">Value</Label>
            <Input
              id="deal-amount"
              type="number"
              min={0}
              step={500}
              value={draft.amount || ""}
              onChange={(e) => set("amount", Number(e.target.value) || 0)}
              placeholder="25000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deal-stage">Stage</Label>
            <Select
              value={draft.stage}
              onValueChange={(v) => setStage(v as DealStage)}
            >
              <SelectTrigger id="deal-stage" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEAL_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deal-contact">Contact</Label>
            <Select
              value={draft.contactId ?? "none"}
              onValueChange={(v) => set("contactId", v === "none" ? null : v)}
            >
              <SelectTrigger id="deal-contact" className="w-full">
                <SelectValue placeholder="No contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No contact</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deal-company">Account</Label>
            <Select
              value={draft.companyId ?? "none"}
              onValueChange={(v) => set("companyId", v === "none" ? null : v)}
            >
              <SelectTrigger id="deal-company" className="w-full">
                <SelectValue placeholder="No account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No account</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deal-owner">Owner</Label>
            <Select
              value={draft.ownerId ?? "none"}
              onValueChange={(v) => set("ownerId", v === "none" ? null : v)}
            >
              <SelectTrigger id="deal-owner" className="w-full">
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
            <Label htmlFor="deal-close">Expected close</Label>
            <Input
              id="deal-close"
              type="date"
              value={toDateInput(draft.expectedCloseDate)}
              onChange={(e) =>
                set(
                  "expectedCloseDate",
                  e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined
                )
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deal-prob">Probability (%)</Label>
            <Input
              id="deal-prob"
              type="number"
              min={0}
              max={100}
              step={5}
              value={draft.probability}
              onChange={(e) => set("probability", Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="deal-notes">Notes</Label>
          <Textarea
            id="deal-notes"
            value={draft.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave} loading={isLoading}>
            {deal ? "Save changes" : "Create deal"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default DealFormModal
