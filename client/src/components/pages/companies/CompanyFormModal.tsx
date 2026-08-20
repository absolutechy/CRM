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
import type { CompanyDraft } from "@/store/companiesSlice"
import type { Company, CompanyStatus } from "@/types/crm"

interface CompanyFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (draft: CompanyDraft) => void
  company?: Company | null
}

const STATUSES: CompanyStatus[] = ["active", "lead", "churned"]

const emptyDraft = (): CompanyDraft => ({
  name: "",
  industry: "",
  website: "",
  location: "",
  status: "lead",
})

const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  company,
}) => {
  const [draft, setDraft] = useState<CompanyDraft>(emptyDraft)

  useEffect(() => {
    if (!isOpen) return
    if (company) {
      const { id: _id, createdAt: _c, ...rest } = company
      setDraft(rest)
    } else {
      setDraft(emptyDraft())
    }
  }, [isOpen, company])

  const set = <K extends keyof CompanyDraft>(key: K, value: CompanyDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const canSave = draft.name.trim().length > 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={company ? "Edit company" : "New company"}
      className="max-w-lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (canSave) onSave({ ...draft, name: draft.name.trim() })
        }}
        className="space-y-5"
      >
        <div className="space-y-1.5">
          <Label htmlFor="company-name">Name *</Label>
          <Input
            id="company-name"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Acme Corp"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={draft.industry}
              onChange={(e) => set("industry", e.target.value)}
              placeholder="Software"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company-status">Status</Label>
            <Select
              value={draft.status}
              onValueChange={(v) => set("status", v as CompanyStatus)}
            >
              <SelectTrigger id="company-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={draft.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Austin, TX"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={draft.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="acme.com"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave}>
            {company ? "Save changes" : "Create company"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CompanyFormModal
