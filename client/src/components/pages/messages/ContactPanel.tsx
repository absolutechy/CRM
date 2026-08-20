import {
  Building2,
  CalendarPlus,
  CheckSquare,
  FileText,
  Mail,
  UserRound,
} from "lucide-react"
import { Link } from "react-router"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { STAGE_BADGE, formatCurrency, getInitials } from "@/lib/crm"
import { useAppSelector } from "@/store/hooks"
import { selectCompanyById } from "@/store/companiesSlice"
import { selectContactById } from "@/store/contactsSlice"
import { selectDealsByContactId } from "@/store/dealsSlice"
import type { RootState } from "@/store"
import { isOpenStage } from "@/types/crm"

import type { Conversation } from "./data"

interface ContactPanelProps {
  conversation: Conversation
}

const attachments = [
  { name: "Proposal_v3.pdf", meta: "2.4 MB · 2 days ago" },
  { name: "Pricing_Tiers.xlsx", meta: "812 KB · 5 days ago" },
]

const ContactPanel: React.FC<ContactPanelProps> = ({ conversation }) => {
  const contact = useAppSelector((s: RootState) =>
    selectContactById(s, conversation.contactId)
  )
  const company = useAppSelector((s: RootState) =>
    contact?.companyId ? selectCompanyById(s, contact.companyId) : undefined
  )
  const deals = useAppSelector((s: RootState) =>
    selectDealsByContactId(s, conversation.contactId)
  )

  if (!contact) return null

  // Show the live deal if there is one, otherwise the most recent closed value.
  const activeDeal = deals.find((d) => isOpenStage(d.stage)) ?? deals[0]
  const dealValue = activeDeal?.amount ?? 0

  return (
    <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l border-border bg-surface xl:flex">
      {/* Identity */}
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <Avatar className="size-16">
          <AvatarFallback className="text-lg">
            {getInitials(contact.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {contact.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {contact.jobTitle}
            {company && ` at ${company.name}`}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="mt-1 w-full">
          <Link to={`/contacts/${contact.id}`}>
            <UserRound />
            View profile
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Deal context */}
      <div className="space-y-3 p-4">
        <h4 className="text-xs font-semibold tracking-wide text-muted-foreground">
          Deal
        </h4>
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-lg font-bold text-foreground">
              {activeDeal ? formatCurrency(dealValue, activeDeal.currency) : "—"}
            </span>
            {activeDeal && (
              <Badge variant={STAGE_BADGE[activeDeal.stage]}>
                {activeDeal.stage}
              </Badge>
            )}
          </div>
          {company && (
            <Link
              to={`/companies/${company.id}`}
              className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              <Building2 className="size-3" />
              {company.name}
            </Link>
          )}
        </div>
      </div>

      <Separator />

      {/* Quick actions */}
      <div className="space-y-1 p-4">
        <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">
          Quick actions
        </h4>
        <Button asChild variant="ghost" size="sm" className="w-full justify-start">
          <Link to="/tasks">
            <CheckSquare />
            Create task
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <CalendarPlus />
          Schedule meeting
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full justify-start">
          <a href={`mailto:${contact.email}`}>
            <Mail />
            Send email
          </a>
        </Button>
      </div>

      <Separator />

      {/* Shared files */}
      <div className="space-y-2 p-4">
        <h4 className="text-xs font-semibold tracking-wide text-muted-foreground">
          Shared files
        </h4>
        <ul className="space-y-1">
          {attachments.map((file) => (
            <li key={file.name}>
              <button className="flex w-full items-center gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-accent">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-100">
                  <FileText className="size-4 text-primary-700" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-foreground">
                    {file.name}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {file.meta}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

export default ContactPanel
