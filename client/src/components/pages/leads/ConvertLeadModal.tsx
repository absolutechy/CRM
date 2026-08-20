import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Building2, TriangleAlert, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/crm"
import { useAppSelector } from "@/store/hooks"
import { selectAllCompanies } from "@/store/companiesSlice"
import { selectContactByEmail } from "@/store/contactsSlice"
import type { Lead } from "@/types/crm"

export interface ConvertOptions {
  /** Existing company to attach to, or null to create one from companyName. */
  companyId: string | null
  createCompany: boolean
  keepLead: boolean
}

interface ConvertLeadModalProps {
  isOpen: boolean
  lead: Lead | null
  onClose: () => void
  onConvert: (lead: Lead, options: ConvertOptions) => void
}

const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
  isOpen,
  lead,
  onClose,
  onConvert,
}) => {
  const companies = useAppSelector(selectAllCompanies)
  const duplicate = useAppSelector((s) =>
    selectContactByEmail(s, lead?.email ?? "")
  )

  const [companyChoice, setCompanyChoice] = useState("new")
  const [keepLead, setKeepLead] = useState(true)

  // Pre-select a company whose name already matches the lead's.
  const matchingCompany = useMemo(
    () =>
      lead
        ? companies.find(
            (c) => c.name.toLowerCase() === lead.companyName.toLowerCase().trim()
          )
        : undefined,
    [companies, lead]
  )

  useEffect(() => {
    if (!isOpen) return
    setCompanyChoice(matchingCompany ? matchingCompany.id : "new")
    setKeepLead(true)
  }, [isOpen, matchingCompany])

  if (!lead) return null

  const createCompany = companyChoice === "new" && !!lead.companyName.trim()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convert lead"
      className="max-w-lg"
    >
      <div className="space-y-5">
        {/* What will happen */}
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-foreground">{lead.name}</span>
            <ArrowRight className="size-4 text-muted-foreground" />
            <span className="flex items-center gap-1.5 text-primary">
              <UserRound className="size-4" />
              Contact
            </span>
            {(createCompany || companyChoice !== "new") && (
              <>
                <span className="text-muted-foreground">+</span>
                <span className="flex items-center gap-1.5 text-primary">
                  <Building2 className="size-4" />
                  Account
                </span>
              </>
            )}
          </div>
          {lead.estimatedValue ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Estimated value {formatCurrency(lead.estimatedValue)} · interaction
              history moves with the lead.
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Interaction history moves across to the new contact.
            </p>
          )}
        </div>

        {duplicate && (
          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-warning-soft p-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-strong" />
            <div className="text-sm">
              <p className="font-medium text-warning-strong">
                A contact already uses this email
              </p>
              <p className="text-muted-foreground">
                {duplicate.name} is already in your contacts. Converting will
                create a second record with the same email.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="convert-company">Account</Label>
          <Select value={companyChoice} onValueChange={setCompanyChoice}>
            <SelectTrigger id="convert-company" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {lead.companyName.trim() && (
                <SelectItem value="new">
                  Create "{lead.companyName}"
                </SelectItem>
              )}
              <SelectItem value="none">No account</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  Link to {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex items-start gap-2.5">
          <Checkbox
            checked={keepLead}
            onCheckedChange={(v) => setKeepLead(!!v)}
            className="mt-0.5"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">
              Keep the lead record
            </span>
            <span className="block text-muted-foreground">
              Marks it converted and links it to the new contact, preserving lead
              history and campaign attribution.
            </span>
          </span>
        </label>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConvert(lead, {
                companyId:
                  companyChoice === "new" || companyChoice === "none"
                    ? null
                    : companyChoice,
                createCompany,
                keepLead,
              })
              onClose()
            }}
          >
            Convert lead
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConvertLeadModal
