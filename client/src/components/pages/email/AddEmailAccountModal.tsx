import { useState } from "react"

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
import { useAppDispatch } from "@/store/hooks"
import { addEmailAccount } from "@/store/emailSlice"
import type { EmailProvider } from "@/types/crm"

interface AddEmailAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

const emptyForm = () => ({
  displayName: "",
  address: "",
  provider: "imap" as EmailProvider,
  host: "",
  port: 587,
  username: "",
  password: "",
})

/** Adds a new SMTP mailbox with its own credentials. */
const AddEmailAccountModal: React.FC<AddEmailAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K]
  ) => setForm((f) => ({ ...f, [key]: value }))

  const canSave =
    form.displayName.trim() &&
    form.address.trim() &&
    form.host.trim() &&
    form.username.trim() &&
    form.password.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave || saving) return
    setSaving(true)
    setError(null)
    try {
      await dispatch(
        addEmailAccount({
          ...form,
          address: form.address.trim(),
          username: form.username.trim(),
        })
      ).unwrap()
      setForm(emptyForm())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add account")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add email account"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="acct-name">Display name *</Label>
            <Input
              id="acct-name"
              value={form.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              placeholder="Work mailbox"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acct-address">Email address *</Label>
            <Input
              id="acct-address"
              type="email"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acct-provider">Provider</Label>
            <Select
              value={form.provider}
              onValueChange={(v) => set("provider", v as EmailProvider)}
            >
              <SelectTrigger id="acct-provider" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="imap">IMAP / SMTP</SelectItem>
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="outlook">Outlook</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acct-host">SMTP host *</Label>
            <Input
              id="acct-host"
              value={form.host}
              onChange={(e) => set("host", e.target.value)}
              placeholder="smtp.company.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acct-port">SMTP port</Label>
            <Input
              id="acct-port"
              type="number"
              min={1}
              max={65535}
              value={form.port}
              onChange={(e) => set("port", Number(e.target.value) || 587)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acct-username">Username *</Label>
            <Input
              id="acct-username"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="acct-password">Password / App password *</Label>
            <Input
              id="acct-password"
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave} loading={saving}>
            Add account
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default AddEmailAccountModal
