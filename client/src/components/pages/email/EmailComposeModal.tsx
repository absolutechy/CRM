import { useEffect, useMemo, useState } from "react"
import { Info, Send, TriangleAlert } from "lucide-react"

import RichTextEditor from "@/components/common/RichTextEditor"
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
import { applyTemplate, unresolvedTokens } from "@/lib/emailTemplates"
import { sendEmailThunk } from "@/store/emailSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectCompanyEntities } from "@/store/companiesSlice"
import { selectAllContacts } from "@/store/contactsSlice"
import {
  selectAllEmailAccounts,
  selectAllTemplates,
} from "@/store/emailSlice"
import { selectAllLeads } from "@/store/leadsSlice"
import { selectCurrentUser } from "@/store/authSlice"
import { selectUserById } from "@/store/usersSlice"
import type { RootState } from "@/store"

interface EmailComposeModalProps {
  isOpen: boolean
  onClose: () => void
  /** Pre-select a recipient when opened from a contact or lead. */
  contactId?: string | null
  leadId?: string | null
}

const EmailComposeModal: React.FC<EmailComposeModalProps> = ({
  isOpen,
  onClose,
  contactId = null,
  leadId = null,
}) => {
  const dispatch = useAppDispatch()
  const contacts = useAppSelector(selectAllContacts)
  const leads = useAppSelector(selectAllLeads)
  const companies = useAppSelector(selectCompanyEntities)
  const templates = useAppSelector(selectAllTemplates)
  const accounts = useAppSelector(selectAllEmailAccounts)
  const currentUser = useAppSelector(selectCurrentUser)
  const sender = useAppSelector((s: RootState) =>
    selectUserById(s, currentUser?.id ?? "")
  )

  const [recipientKey, setRecipientKey] = useState("")
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "")
  const [templateId, setTemplateId] = useState("none")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // One flat recipient list spanning contacts and leads.
  const recipients = useMemo(
    () => [
      ...contacts.map((c) => ({
        key: `contact:${c.id}`,
        label: `${c.name} · ${c.email}`,
        email: c.email,
        record: c,
        companyName: c.companyId ? (companies[c.companyId]?.name ?? "") : "",
      })),
      ...leads.map((l) => ({
        key: `lead:${l.id}`,
        label: `${l.name} · ${l.email} (lead)`,
        email: l.email,
        record: l,
        companyName: l.companyName,
      })),
    ],
    [contacts, leads, companies]
  )

  const selected = recipients.find((r) => r.key === recipientKey)

  useEffect(() => {
    if (!isOpen) return
    setRecipientKey(
      contactId ? `contact:${contactId}` : leadId ? `lead:${leadId}` : ""
    )
    setAccountId(accounts[0]?.id ?? "")
    setTemplateId("none")
    setSubject("")
    setBody("")
    setNotice(null)
  }, [isOpen, contactId, leadId, accounts])

  /** Applying a template fills subject + body with tokens resolved. */
  const applySelectedTemplate = (id: string) => {
    setTemplateId(id)
    if (id === "none") return
    const template = templates.find((t) => t.id === id)
    if (!template) return
    const ctx = {
      contact: selected?.record,
      companyName: selected?.companyName,
      sender,
    }
    setSubject(applyTemplate(template.subject, ctx))
    setBody(applyTemplate(template.body, ctx))
  }

  const leftover = unresolvedTokens(`${subject} ${body}`)
  const canSend = !!selected && subject.trim().length > 0

  const handleSend = async () => {
    if (!selected || sending) return
    setSending(true)
    setNotice(null)
    try {
      const result = await dispatch(
        sendEmailThunk({
          accountId,
          to: [selected.email],
          cc: [],
          subject,
          body,
          contactId: recipientKey.startsWith("contact:")
            ? recipientKey.slice(8)
            : null,
          leadId: recipientKey.startsWith("lead:") ? recipientKey.slice(5) : null,
          templateId: templateId === "none" ? null : templateId,
        })
      ).unwrap()
      if (!result.sent) {
        setNotice(result.message)
        return
      }
      onClose()
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Failed to send email."
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose email"
      className="max-w-3xl"
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="compose-from">From</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="compose-from" className="w-full">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.address}
                    {!a.connected && " (not connected)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="compose-to">To *</Label>
            <Select value={recipientKey} onValueChange={setRecipientKey}>
              <SelectTrigger id="compose-to" className="w-full">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {recipients.map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="compose-template">Template</Label>
          <Select value={templateId} onValueChange={applySelectedTemplate}>
            <SelectTrigger id="compose-template" className="w-full">
              <SelectValue placeholder="Start from scratch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Start from scratch</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {templateId !== "none" && !selected && (
            <p className="text-xs text-warning-strong">
              Pick a recipient first so tokens like {"{{firstName}}"} resolve.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="compose-subject">Subject *</Label>
          <Input
            id="compose-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Quick question about your rollout"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Message</Label>
          <RichTextEditor value={body} onChange={setBody} minHeight="12rem" />
        </div>

        {leftover.length > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-warning-strong">
            <TriangleAlert className="size-3.5" />
            Unresolved tokens: {leftover.join(", ")}
          </p>
        )}

        {/* Result / notice banner */}
        {notice && (
          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-info-soft p-3">
            <Info className="mt-0.5 size-4 shrink-0 text-info-strong" />
            <div className="text-sm">
              <p className="font-medium text-info-strong">Not sent</p>
              <p className="text-muted-foreground">{notice}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Close
          </Button>
          <Button onClick={handleSend} disabled={!canSend} loading={sending}>
            <Send />
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default EmailComposeModal
