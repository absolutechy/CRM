import type { ComponentProps, ElementType } from "react"
import {
  CalendarDays,
  HelpCircle,
  Mail,
  Phone,
  Sparkles,
  StickyNote,
  UserPlus,
} from "lucide-react"

import type { Badge } from "@/components/ui/badge"
import type {
  ActivityType,
  Address,
  CampaignResponse,
  CampaignStatus,
  CampaignType,
  CompanyStatus,
  ContactStatus,
  DealStage,
  DocumentCategory,
  EmailStatus,
  LeadSource,
  LeadStatus,
} from "@/types/crm"

type BadgeVariant = ComponentProps<typeof Badge>["variant"]

/** Icon + label + badge tone for every activity type, including system events. */
export const INTERACTION_META: Record<
  ActivityType,
  { label: string; icon: ElementType; badge: BadgeVariant }
> = {
  call: { label: "Call", icon: Phone, badge: "info" },
  email: { label: "Email", icon: Mail, badge: "accent" },
  meeting: { label: "Meeting", icon: CalendarDays, badge: "warning" },
  note: { label: "Note", icon: StickyNote, badge: "muted" },
  inquiry: { label: "Inquiry", icon: HelpCircle, badge: "success" },
  created: { label: "Created", icon: UserPlus, badge: "muted" },
  status_change: { label: "Status change", icon: Sparkles, badge: "muted" },
}

export const formatDuration = (minutes?: number) =>
  !minutes ? "" : minutes < 60 ? `${minutes}m` : `${Math.round(minutes / 6) / 10}h`

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

export const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

export const CONTACT_STATUS_BADGE: Record<ContactStatus, BadgeVariant> = {
  Active: "success",
  Inactive: "muted",
  Pending: "warning",
}

export const COMPANY_STATUS_BADGE: Record<CompanyStatus, BadgeVariant> = {
  active: "success",
  lead: "warning",
  churned: "muted",
}

export const STAGE_BADGE: Record<DealStage, BadgeVariant> = {
  New: "info",
  Contacted: "accent",
  Qualified: "success",
  Negotiation: "warning",
  Won: "success",
  Lost: "error",
}

export const LEAD_STATUS_BADGE: Record<LeadStatus, BadgeVariant> = {
  new: "info",
  contacted: "accent",
  qualified: "success",
  unqualified: "muted",
  converted: "success",
}

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  unqualified: "Unqualified",
  converted: "Converted",
}

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  web: "Website",
  referral: "Referral",
  event: "Event",
  outreach: "Outreach",
  campaign: "Campaign",
  other: "Other",
}

export const CAMPAIGN_STATUS_BADGE: Record<CampaignStatus, BadgeVariant> = {
  draft: "muted",
  scheduled: "info",
  active: "success",
  paused: "warning",
  completed: "accent",
}

export const CAMPAIGN_TYPE_LABEL: Record<CampaignType, string> = {
  email: "Email",
  event: "Event",
  webinar: "Webinar",
  social: "Social",
  other: "Other",
}

export const CAMPAIGN_RESPONSE_BADGE: Record<CampaignResponse, BadgeVariant> = {
  none: "muted",
  opened: "info",
  clicked: "accent",
  replied: "warning",
  converted: "success",
}

export const DOCUMENT_CATEGORY_BADGE: Record<DocumentCategory, BadgeVariant> = {
  proposal: "info",
  quote: "accent",
  contract: "success",
  other: "muted",
}

export const EMAIL_STATUS_BADGE: Record<EmailStatus, BadgeVariant> = {
  draft: "muted",
  queued: "info",
  sent: "success",
  failed: "error",
}

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}

/** Strips HTML so rich-text bodies can be previewed in table cells. */
export const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

export const formatCurrency = (amount: number, currency = "USD") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

export const formatAddress = (address: Address) =>
  [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ")

export const hasAddress = (address: Address) =>
  Object.values(address).some(Boolean)
