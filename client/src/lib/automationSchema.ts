import type {
  ActionType,
  ConditionOperator,
  TriggerEntity,
  TriggerEvent,
} from "@/types/crm"

/**
 * Metadata that drives the rule builder's pickers. Keeping it declarative means
 * the builder adapts automatically when new entities or fields are added, and
 * gives the future backend engine a shared contract to validate against.
 */

export type FieldType = "text" | "number" | "select" | "user" | "date"

export interface FieldSchema {
  name: string
  label: string
  type: FieldType
  options?: { value: string; label: string }[]
}

export const TRIGGER_ENTITIES: {
  value: TriggerEntity
  label: string
  fields: FieldSchema[]
}[] = [
  {
    value: "lead",
    label: "Lead",
    fields: [
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "new", label: "New" },
          { value: "contacted", label: "Contacted" },
          { value: "qualified", label: "Qualified" },
          { value: "unqualified", label: "Unqualified" },
          { value: "converted", label: "Converted" },
        ],
      },
      {
        name: "source",
        label: "Source",
        type: "select",
        options: [
          { value: "web", label: "Website" },
          { value: "referral", label: "Referral" },
          { value: "event", label: "Event" },
          { value: "outreach", label: "Outreach" },
          { value: "campaign", label: "Campaign" },
          { value: "other", label: "Other" },
        ],
      },
      { name: "estimatedValue", label: "Estimated value", type: "number" },
      { name: "ownerId", label: "Owner", type: "user" },
      { name: "daysInactive", label: "Days inactive", type: "number" },
    ],
  },
  {
    value: "contact",
    label: "Contact",
    fields: [
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
          { value: "Pending", label: "Pending" },
        ],
      },
      { name: "jobTitle", label: "Job title", type: "text" },
      { name: "companyId", label: "Company", type: "text" },
      { name: "daysInactive", label: "Days inactive", type: "number" },
    ],
  },
  {
    value: "deal",
    label: "Deal",
    fields: [
      { name: "amount", label: "Amount", type: "number" },
      {
        name: "stage",
        label: "Stage",
        type: "select",
        options: [
          { value: "New", label: "New" },
          { value: "Qualified", label: "Qualified" },
          { value: "Negotiation", label: "Negotiation" },
          { value: "Won", label: "Won" },
          { value: "Lost", label: "Lost" },
        ],
      },
    ],
  },
  {
    value: "task",
    label: "Task",
    fields: [
      {
        name: "priority",
        label: "Priority",
        type: "select",
        options: [
          { value: "Low", label: "Low" },
          { value: "Medium", label: "Medium" },
          { value: "High", label: "High" },
        ],
      },
      { name: "dueDate", label: "Due date", type: "date" },
    ],
  },
  {
    value: "campaign",
    label: "Campaign",
    fields: [
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "draft", label: "Draft" },
          { value: "active", label: "Active" },
          { value: "completed", label: "Completed" },
        ],
      },
    ],
  },
]

export const TRIGGER_EVENTS: { value: TriggerEvent; label: string }[] = [
  { value: "created", label: "is created" },
  { value: "updated", label: "is updated" },
  { value: "stage_changed", label: "changes stage or status" },
  { value: "inactive_for", label: "has been inactive" },
]

export const OPERATORS: {
  value: ConditionOperator
  label: string
  types: FieldType[]
}[] = [
  { value: "is", label: "is", types: ["text", "number", "select", "user", "date"] },
  { value: "is_not", label: "is not", types: ["text", "number", "select", "user"] },
  { value: "contains", label: "contains", types: ["text"] },
  { value: "gt", label: "is greater than", types: ["number", "date"] },
  { value: "lt", label: "is less than", types: ["number", "date"] },
  { value: "is_empty", label: "is empty", types: ["text", "select", "user"] },
]

export const ACTION_TYPES: {
  value: ActionType
  label: string
  description: string
  params: FieldSchema[]
}[] = [
  {
    value: "create_task",
    label: "Create a task",
    description: "Adds a follow-up task so nothing gets forgotten.",
    params: [
      { name: "title", label: "Task title", type: "text" },
      { name: "dueInDays", label: "Due in (days)", type: "number" },
    ],
  },
  {
    value: "assign_owner",
    label: "Assign owner",
    description: "Routes the record to a team member.",
    params: [{ name: "userId", label: "Assign to", type: "user" }],
  },
  {
    value: "update_field",
    label: "Update a field",
    description: "Sets a field on the triggering record.",
    params: [
      { name: "field", label: "Field", type: "text" },
      { name: "value", label: "New value", type: "text" },
    ],
  },
  {
    value: "move_stage",
    label: "Move stage",
    description: "Advances the record through your pipeline.",
    params: [{ name: "stage", label: "Move to", type: "text" }],
  },
  {
    value: "send_notification",
    label: "Send a notification",
    description: "Alerts the record owner in-app.",
    params: [{ name: "message", label: "Message", type: "text" }],
  },
  {
    value: "send_email",
    label: "Send an email",
    description: "Sends a templated email to the contact or lead.",
    params: [{ name: "templateId", label: "Template", type: "text" }],
  },
]

export const fieldsFor = (entity: TriggerEntity) =>
  TRIGGER_ENTITIES.find((e) => e.value === entity)?.fields ?? []

export const operatorsFor = (type: FieldType) =>
  OPERATORS.filter((o) => o.types.includes(type))

export const actionMeta = (type: ActionType) =>
  ACTION_TYPES.find((a) => a.value === type)
