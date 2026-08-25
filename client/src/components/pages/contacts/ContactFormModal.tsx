import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Link } from "react-router"

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
import { useAppSelector } from "@/store/hooks"
import { selectContactByEmail } from "@/store/contactsSlice"
import { selectAllCompanies } from "@/store/companiesSlice"
import type { ContactDraft } from "@/store/contactsSlice"
import type { Contact, ContactStatus } from "@/types/crm"
import { EMPTY_ADDRESS, EMPTY_SOCIAL } from "@/types/crm"

interface ContactFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (draft: ContactDraft) => void
  /** Present when editing; omit to create. */
  contact?: Contact | null
  isLoading?: boolean
}

const STATUSES: ContactStatus[] = ["Active", "Inactive", "Pending"]

const emptyDraft = (): ContactDraft => ({
  name: "",
  jobTitle: "",
  email: "",
  phone: "",
  companyId: null,
  address: { ...EMPTY_ADDRESS },
  social: { ...EMPTY_SOCIAL },
  status: "Active",
  tags: [],
})

const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contact,
  isLoading = false,
}) => {
  const companies = useAppSelector(selectAllCompanies)
  const [draft, setDraft] = useState<ContactDraft>(emptyDraft)
  const [touchedEmail, setTouchedEmail] = useState(false)

  // Duplicate guard: an email already owned by a *different* contact.
  const duplicate = useAppSelector((state) =>
    selectContactByEmail(state, draft.email, contact?.id)
  )

  useEffect(() => {
    if (!isOpen) return
    setTouchedEmail(false)
    if (contact) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = contact
      setDraft({
        ...rest,
        address: { ...contact.address },
        social: { ...contact.social },
        tags: [...contact.tags],
      })
    } else {
      setDraft(emptyDraft())
    }
  }, [isOpen, contact])

  const set = <K extends keyof ContactDraft>(key: K, value: ContactDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const setAddress = (key: keyof ContactDraft["address"], value: string) =>
    setDraft((d) => ({ ...d, address: { ...d.address, [key]: value } }))

  const setSocial = (key: keyof ContactDraft["social"], value: string) =>
    setDraft((d) => ({ ...d, social: { ...d.social, [key]: value } }))

  const nameValid = draft.name.trim().length > 0
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())
  const canSave = nameValid && emailValid && !duplicate

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    onSave({ ...draft, name: draft.name.trim(), email: draft.email.trim() })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contact ? "Edit contact" : "New contact"}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Jane Cooper"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jobTitle">Job title</Label>
            <Input
              id="jobTitle"
              value={draft.jobTitle}
              onChange={(e) => set("jobTitle", e.target.value)}
              placeholder="Head of Operations"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={draft.email}
              onChange={(e) => set("email", e.target.value)}
              onBlur={() => setTouchedEmail(true)}
              placeholder="jane@company.com"
              aria-invalid={!!duplicate || (touchedEmail && !emailValid)}
              required
            />
            {touchedEmail && !emailValid && !duplicate && (
              <p className="text-xs text-error-strong">
                Enter a valid email address.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={draft.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(555) 555-0100"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company">Company</Label>
            <Select
              value={draft.companyId ?? "none"}
              onValueChange={(v) => set("companyId", v === "none" ? null : v)}
            >
              <SelectTrigger id="company" className="w-full">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No company</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              value={draft.status}
              onValueChange={(v) => set("status", v as ContactStatus)}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Duplicate warning — checklist item: avoid duplicate records */}
        {duplicate && (
          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-warning-soft p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-strong" />
            <div className="text-sm">
              <p className="font-medium text-warning-strong">
                This email already exists
              </p>
              <p className="text-muted-foreground">
                {duplicate.name} already uses {duplicate.email}.{" "}
                <Link
                  to={`/contacts/${duplicate.id}`}
                  onClick={onClose}
                  className="font-medium text-primary hover:underline"
                >
                  Open that contact
                </Link>{" "}
                instead of creating a duplicate.
              </p>
            </div>
          </div>
        )}

        {/* Address */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold tracking-wide text-muted-foreground">
            Address
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                value={draft.address.street}
                onChange={(e) => setAddress("street", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={draft.address.city}
                onChange={(e) => setAddress("city", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State / Region</Label>
              <Input
                id="state"
                value={draft.address.state}
                onChange={(e) => setAddress("state", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postalCode">Postal code</Label>
              <Input
                id="postalCode"
                value={draft.address.postalCode}
                onChange={(e) => setAddress("postalCode", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={draft.address.country}
                onChange={(e) => setAddress("country", e.target.value)}
              />
            </div>
          </div>
        </fieldset>

        {/* Social profiles */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold tracking-wide text-muted-foreground">
            Social profiles
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={draft.social.linkedin}
                onChange={(e) => setSocial("linkedin", e.target.value)}
                placeholder="linkedin.com/in/…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="twitter">X / Twitter</Label>
              <Input
                id="twitter"
                value={draft.social.twitter}
                onChange={(e) => setSocial("twitter", e.target.value)}
                placeholder="@handle"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={draft.social.website}
                onChange={(e) => setSocial("website", e.target.value)}
                placeholder="example.com"
              />
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave} loading={isLoading}>
            {contact ? "Save changes" : "Create contact"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ContactFormModal
