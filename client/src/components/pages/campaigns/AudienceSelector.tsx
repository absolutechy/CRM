import { useMemo, useState } from "react"
import { Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL } from "@/lib/crm"
import { useAppSelector } from "@/store/hooks"
import { selectCompanyEntities } from "@/store/companiesSlice"
import { selectAllContacts } from "@/store/contactsSlice"
import { selectAllLeads } from "@/store/leadsSlice"
import { LEAD_SOURCES, LEAD_STATUSES } from "@/types/crm"

interface AudienceSelectorProps {
  isOpen: boolean
  onClose: () => void
  /** Ids already in the campaign, so they can be excluded. */
  existingContactIds: string[]
  existingLeadIds: string[]
  onAdd: (input: { contactIds: string[]; leadIds: string[] }) => void
}

/**
 * Segment builder — filter contacts and leads, see a live count, then add the
 * resulting set as campaign members.
 */
const AudienceSelector: React.FC<AudienceSelectorProps> = ({
  isOpen,
  onClose,
  existingContactIds,
  existingLeadIds,
  onAdd,
}) => {
  const contacts = useAppSelector(selectAllContacts)
  const leads = useAppSelector(selectAllLeads)
  const companies = useAppSelector(selectCompanyEntities)

  const [audience, setAudience] = useState<"both" | "contacts" | "leads">("both")
  const [contactStatus, setContactStatus] = useState("all")
  const [leadStatus, setLeadStatus] = useState("all")
  const [leadSource, setLeadSource] = useState("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const candidates = useMemo(() => {
    const rows: {
      key: string
      id: string
      kind: "contact" | "lead"
      name: string
      detail: string
    }[] = []

    if (audience !== "leads") {
      for (const c of contacts) {
        if (existingContactIds.includes(c.id)) continue
        if (contactStatus !== "all" && c.status !== contactStatus) continue
        rows.push({
          key: `contact:${c.id}`,
          id: c.id,
          kind: "contact",
          name: c.name,
          detail: `${c.jobTitle || "—"} · ${c.companyId ? (companies[c.companyId]?.name ?? "") : "No account"}`,
        })
      }
    }

    if (audience !== "contacts") {
      for (const l of leads) {
        if (existingLeadIds.includes(l.id)) continue
        if (leadStatus !== "all" && l.status !== leadStatus) continue
        if (leadSource !== "all" && l.source !== leadSource) continue
        rows.push({
          key: `lead:${l.id}`,
          id: l.id,
          kind: "lead",
          name: l.name,
          detail: `${LEAD_STATUS_LABEL[l.status]} · ${l.companyName || "—"}`,
        })
      }
    }

    return rows
  }, [
    audience,
    contacts,
    leads,
    companies,
    contactStatus,
    leadStatus,
    leadSource,
    existingContactIds,
    existingLeadIds,
  ])

  const allSelected =
    candidates.length > 0 && candidates.every((c) => selected.has(c.key))

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const handleAdd = () => {
    const contactIds: string[] = []
    const leadIds: string[] = []
    for (const key of selected) {
      const [kind, id] = key.split(":")
      if (kind === "contact") contactIds.push(id)
      else leadIds.push(id)
    }
    onAdd({ contactIds, leadIds })
    setSelected(new Set())
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add audience"
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Segment filters */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="aud-type">Audience</Label>
            <Select
              value={audience}
              onValueChange={(v) => setAudience(v as typeof audience)}
            >
              <SelectTrigger id="aud-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Contacts and leads</SelectItem>
                <SelectItem value="contacts">Contacts only</SelectItem>
                <SelectItem value="leads">Leads only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {audience !== "leads" && (
            <div className="space-y-1.5">
              <Label htmlFor="aud-cstatus">Contact status</Label>
              <Select value={contactStatus} onValueChange={setContactStatus}>
                <SelectTrigger id="aud-cstatus" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {audience !== "contacts" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="aud-lstatus">Lead status</Label>
                <Select value={leadStatus} onValueChange={setLeadStatus}>
                  <SelectTrigger id="aud-lstatus" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any status</SelectItem>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {LEAD_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aud-lsource">Lead source</Label>
                <Select value={leadSource} onValueChange={setLeadSource}>
                  <SelectTrigger id="aud-lsource" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any source</SelectItem>
                    {LEAD_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {LEAD_SOURCE_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        {/* Live count + select all */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span className="font-medium text-foreground">
              {candidates.length}
            </span>
            match this segment · {selected.size} selected
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setSelected(
                allSelected ? new Set() : new Set(candidates.map((c) => c.key))
              )
            }
            disabled={candidates.length === 0}
          >
            {allSelected ? "Clear all" : "Select all"}
          </Button>
        </div>

        {/* Candidates */}
        <ScrollArea className="h-64 rounded-lg border border-border">
          {candidates.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nobody matches this segment, or they're already members.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {candidates.map((c) => (
                <li key={c.key}>
                  <label className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-accent/60">
                    <Checkbox
                      checked={selected.has(c.key)}
                      onCheckedChange={() => toggle(c.key)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {c.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {c.detail}
                      </span>
                    </span>
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {c.kind}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selected.size === 0}>
            Add {selected.size > 0 && selected.size} to campaign
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default AudienceSelector
