export type UserRole = "admin" | "manager" | "rep"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  /** Tailwind token suffix used for the avatar tint, e.g. "primary". */
  avatarColor: string
}

export type ContactStatus = "Active" | "Inactive" | "Pending"

export type DealStage =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Negotiation"
  | "Won"
  | "Lost"

export type CompanyStatus = "active" | "lead" | "churned"

export interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface SocialProfiles {
  linkedin: string
  twitter: string
  website: string
}

/**
 * The single canonical customer record. Every feature (contacts list, dashboard,
 * messages) reads identity from here rather than keeping its own copy.
 */
export interface Contact {
  id: string
  name: string
  jobTitle: string
  email: string
  phone: string
  /** FK into the companies slice; replaces the old free-text company string. */
  companyId: string | null
  address: Address
  social: SocialProfiles
  status: ContactStatus
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Company {
  id: string
  name: string
  industry: string
  website: string
  location: string
  status: CompanyStatus
  createdAt: string
}

/** Interactions a user logs deliberately. */
export type InteractionType = "call" | "email" | "meeting" | "note" | "inquiry"

/** System events the app records automatically. */
export type SystemActivityType = "created" | "status_change"

export type ActivityType = InteractionType | SystemActivityType

export type ActivityStatus = "logged" | "planned"

export type ActivityDirection = "inbound" | "outbound"

export const INTERACTION_TYPES: InteractionType[] = [
  "call",
  "email",
  "meeting",
  "note",
  "inquiry",
]

export const isInteractionType = (type: ActivityType): type is InteractionType =>
  (INTERACTION_TYPES as ActivityType[]).includes(type)

export interface Activity {
  id: string
  /** Null for interactions logged against a lead that isn't a contact yet. */
  contactId: string | null
  /** Set for lead interactions; re-parented to `contactId` on conversion. */
  leadId?: string | null
  /**
   * Denormalized from the contact at write time so an interaction stays
   * attached to the account even if the contact is later reassigned.
   */
  companyId: string | null
  type: ActivityType
  status: ActivityStatus
  /** Inbound for customer-initiated contact (inquiries, received calls). */
  direction?: ActivityDirection
  summary: string
  body?: string
  /** When it happened (logged) — also the sort key for the timeline. */
  at: string
  /** Set for `planned` interactions; drives the dashboard agenda. */
  scheduledAt?: string
  durationMinutes?: number
  actor: string
}

export const DEAL_STAGES: DealStage[] = [
  "New",
  "Contacted",
  "Qualified",
  "Negotiation",
  "Won",
  "Lost",
]

/** Stages that are still live — everything except the two closed outcomes. */
export const OPEN_DEAL_STAGES: DealStage[] = [
  "New",
  "Contacted",
  "Qualified",
  "Negotiation",
]

export const isOpenStage = (stage: DealStage) =>
  stage !== "Won" && stage !== "Lost"

/**
 * A sales opportunity. Won deals double as the customer's purchase history,
 * which is why the contact detail Sales tab reads from here.
 */
export interface Deal {
  id: string
  title: string
  reference: string
  contactId: string | null
  companyId: string | null
  ownerId: string | null
  amount: number
  currency: string
  stage: DealStage
  /** 0–100. Defaults follow the stage but can be overridden per deal. */
  probability: number
  expectedCloseDate?: string
  closedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

/** Sensible default win probability per stage, used when creating a deal. */
export const STAGE_PROBABILITY: Record<DealStage, number> = {
  New: 10,
  Contacted: 25,
  Qualified: 50,
  Negotiation: 75,
  Won: 100,
  Lost: 0,
}

// ---------------------------------------------------------------- Tasks

export type TaskPriority = "Low" | "Medium" | "High" | "Urgent"
export type TaskStatus = "backlog" | "todo" | "in-progress" | "done"

export const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Urgent"]

export const TASK_STATUSES: TaskStatus[] = [
  "backlog",
  "todo",
  "in-progress",
  "done",
]

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
}

export interface TaskChecklist {
  id: string
  title: string
  items: { id: string; text: string; completed: boolean }[]
}

export interface TaskComment {
  id: string
  text: string
  timestamp: string
}

export interface TaskAttachment {
  name: string
  url: string
  type: string
}

export interface Task {
  id: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  assigneeId: string | null
  dueDate?: string
  /** Optional links back to the record this task follows up on. */
  contactId?: string | null
  leadId?: string | null
  dealId?: string | null
  checklists: TaskChecklist[]
  comments: TaskComment[]
  attachments: TaskAttachment[]
  createdAt: string
  completedAt?: string
}

export const EMPTY_ADDRESS: Address = {
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
}

export const EMPTY_SOCIAL: SocialProfiles = {
  linkedin: "",
  twitter: "",
  website: "",
}

// ---------------------------------------------------------------- Leads

export type LeadSource =
  | "web"
  | "referral"
  | "event"
  | "outreach"
  | "campaign"
  | "other"

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "unqualified"
  | "converted"

export const LEAD_SOURCES: LeadSource[] = [
  "web",
  "referral",
  "event",
  "outreach",
  "campaign",
  "other",
]

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "unqualified",
  "converted",
]

export interface Lead {
  id: string
  name: string
  jobTitle: string
  email: string
  phone: string
  /** Free text — a lead's company isn't an account until conversion. */
  companyName: string
  source: LeadSource
  status: LeadStatus
  ownerId: string | null
  estimatedValue?: number
  notes?: string
  campaignId?: string | null
  createdAt: string
  updatedAt: string
  convertedContactId?: string
  convertedCompanyId?: string | null
}

// ---------------------------------------------------------------- Email

export type EmailProvider = "gmail" | "outlook" | "imap"

export interface EmailAccount {
  id: string
  address: string
  provider: EmailProvider
  displayName: string
  connected: boolean
  lastSyncedAt?: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  /** HTML from the TipTap editor. */
  body: string
  category: string
  updatedAt: string
}

export type EmailStatus = "draft" | "queued" | "sent" | "failed"

export interface EmailMessage {
  id: string
  accountId: string | null
  contactId?: string | null
  leadId?: string | null
  companyId?: string | null
  subject: string
  body: string
  from: string
  to: string[]
  cc: string[]
  templateId?: string | null
  status: EmailStatus
  sentAt?: string
  openedAt?: string
  clickedAt?: string
}

// ---------------------------------------------------------------- Documents

export type DocumentCategory = "proposal" | "quote" | "contract" | "other"

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "proposal",
  "quote",
  "contract",
  "other",
]

export interface CrmDocument {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  category: DocumentCategory
  contactId?: string | null
  companyId?: string | null
  leadId?: string | null
  /** Proposals, quotes and contracts attach to the deal they belong to. */
  dealId?: string | null
  uploadedById: string
  uploadedAt: string
  /** Populated by the storage backend once connected. */
  url?: string
}

// ---------------------------------------------------------------- Campaigns

export type CampaignType = "email" | "event" | "webinar" | "social" | "other"

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "completed"

export const CAMPAIGN_TYPES: CampaignType[] = [
  "email",
  "event",
  "webinar",
  "social",
  "other",
]

export const CAMPAIGN_STATUSES: CampaignStatus[] = [
  "draft",
  "scheduled",
  "active",
  "paused",
  "completed",
]

export interface Campaign {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  startDate: string
  endDate?: string
  goal?: string
  budget?: number
  ownerId: string | null
  templateId?: string | null
  createdAt: string
}

export type CampaignResponse =
  | "none"
  | "opened"
  | "clicked"
  | "replied"
  | "converted"

export const CAMPAIGN_RESPONSES: CampaignResponse[] = [
  "none",
  "opened",
  "clicked",
  "replied",
  "converted",
]

export interface CampaignMember {
  id: string
  campaignId: string
  contactId?: string | null
  leadId?: string | null
  response: CampaignResponse
  addedAt: string
}

// ---------------------------------------------------------------- Automation

export type TriggerEntity = "contact" | "lead" | "deal" | "task" | "campaign"

export type TriggerEvent =
  | "created"
  | "updated"
  | "stage_changed"
  | "inactive_for"

export type ConditionOperator =
  | "is"
  | "is_not"
  | "contains"
  | "gt"
  | "lt"
  | "is_empty"

export type ActionType =
  | "create_task"
  | "update_field"
  | "assign_owner"
  | "send_notification"
  | "send_email"
  | "move_stage"

export interface RuleCondition {
  id: string
  field: string
  operator: ConditionOperator
  value: string
}

export interface RuleAction {
  id: string
  type: ActionType
  params: Record<string, string>
}

export interface AutomationRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  trigger: { entity: TriggerEntity; event: TriggerEvent }
  conditions: RuleCondition[]
  actions: RuleAction[]
  createdAt: string
  updatedAt: string
}
