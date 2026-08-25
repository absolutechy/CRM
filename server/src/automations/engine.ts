import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { sendEmail as deliverEmail } from "@/services/emailsService"

export type TriggerEntity = "contact" | "lead" | "deal" | "task" | "campaign"
export type TriggerEvent =
  | "created"
  | "updated"
  | "stage_changed"
  | "inactive_for"

interface RuleCondition {
  field: string
  operator: "is" | "is_not" | "contains" | "gt" | "lt" | "is_empty"
  value: string
}

interface RuleAction {
  type:
    | "create_task"
    | "update_field"
    | "assign_owner"
    | "send_notification"
    | "send_email"
    | "move_stage"
  params: Record<string, string>
}

interface Rule {
  id: string
  name: string
  triggerEntity: TriggerEntity
  triggerEvent: TriggerEvent
  conditions: RuleCondition[]
  actions: RuleAction[]
}

const MAX_DEPTH = 5

/** Read a dotted path (e.g. "ownerId") off a record object. */
const getField = (record: Record<string, unknown>, field: string): unknown => {
  const value = field
    .split(".")
    .reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object" && key in (acc as object)) {
        return (acc as Record<string, unknown>)[key]
      }
      return undefined
    }, record)
  return value
}

/** Evaluate one condition against a record. */
export const matchesCondition = (
  record: Record<string, unknown>,
  condition: RuleCondition
): boolean => {
  const value = getField(record, condition.field)
  const target = condition.value

  switch (condition.operator) {
    case "is":
      return String(value ?? "") === target
    case "is_not":
      return String(value ?? "") !== target
    case "contains":
      return String(value ?? "").toLowerCase().includes(target.toLowerCase())
    case "gt": {
      const n = Number(value)
      return !Number.isNaN(n) && n > Number(target)
    }
    case "lt": {
      const n = Number(value)
      return !Number.isNaN(n) && n < Number(target)
    }
    case "is_empty":
      return value === null || value === undefined || value === ""
    default:
      return false
  }
}

/** All conditions must pass (AND semantics). */
export const matchesAll = (
  record: Record<string, unknown>,
  conditions: RuleCondition[]
): boolean =>
  conditions.every((c) => matchesCondition(record, c))

/** Load enabled rules that fire for this entity+event. */
export const loadRules = async (
  entity: TriggerEntity,
  event: TriggerEvent
): Promise<Rule[]> => {
  const rules = await prisma.automationRule.findMany({
    where: { enabled: true, triggerEntity: entity, triggerEvent: event },
  })
  return rules as unknown as Rule[]
}

/** Create a follow-up task for a record, skipping if one already exists. */
const runCreateTask = async (
  rule: Rule,
  record: Record<string, unknown>,
  actorId: string,
  params: Record<string, string>
): Promise<string | null> => {
  const title = params.title || `${rule.name}: follow-up`
  const dueInDays = Number(params.dueInDays) || 0
  const dueDate = new Date(Date.now() + dueInDays * 86_400_000)

  const entity = rule.triggerEntity
  const existing = await prisma.task.findFirst({
    where: {
      title,
      completedAt: null,
      ...(entity === "lead" ? { leadId: String(record.id) } : {}),
      ...(entity === "contact" ? { contactId: String(record.id) } : {}),
      ...(entity === "deal" ? { dealId: String(record.id) } : {}),
    },
  })
  if (existing) return null // idempotent

  const task = await prisma.task.create({
    data: {
      title,
      description: `Auto-created by rule "${rule.name}"`,
      priority: "Medium",
      status: "todo",
      assigneeId: actorId,
      dueDate,
      contactId: entity === "contact" ? String(record.id) : null,
      leadId: entity === "lead" ? String(record.id) : null,
      dealId: entity === "deal" ? String(record.id) : null,
    },
  })
  return task.id
}

const runAssignOwner = async (
  rule: Rule,
  record: Record<string, unknown>,
  params: Record<string, string>
): Promise<string | null> => {
  const userId = params.userId
  if (!userId) return null
  const entity = rule.triggerEntity
  if (entity === "lead") {
    await prisma.lead.update({ where: { id: String(record.id) }, data: { ownerId: userId } })
    return "lead.ownerId"
  }
  if (entity === "deal") {
    await prisma.deal.update({ where: { id: String(record.id) }, data: { ownerId: userId } })
    return "deal.ownerId"
  }
  if (entity === "task") {
    await prisma.task.update({ where: { id: String(record.id) }, data: { assigneeId: userId } })
    return "task.assigneeId"
  }
  return null
}

const runUpdateField = async (
  rule: Rule,
  record: Record<string, unknown>,
  params: Record<string, string>
): Promise<string | null> => {
  const field = params.field
  const value = params.value
  if (!field) return null

  const entity = rule.triggerEntity
  if (entity === "lead") {
    await prisma.lead.update({ where: { id: String(record.id) }, data: { [field]: value } })
    return `lead.${field}`
  }
  if (entity === "contact") {
    await prisma.contact.update({ where: { id: String(record.id) }, data: { [field]: value } })
    return `contact.${field}`
  }
  if (entity === "deal") {
    await prisma.deal.update({ where: { id: String(record.id) }, data: { [field]: value } })
    return `deal.${field}`
  }
  return null
}

const runMoveStage = async (
  rule: Rule,
  record: Record<string, unknown>,
  params: Record<string, string>
): Promise<string | null> => {
  const stage = params.stage
  if (!stage) return null

  const entity = rule.triggerEntity
  if (entity === "lead" && ["new", "contacted", "qualified", "unqualified", "converted"].includes(stage)) {
    await prisma.lead.update({ where: { id: String(record.id) }, data: { status: stage as any } })
    return `lead.status=${stage}`
  }
  if (entity === "deal" && ["New", "Contacted", "Qualified", "Negotiation", "Won", "Lost"].includes(stage)) {
    await prisma.deal.update({
      where: { id: String(record.id) },
      data: { stage: stage as any, closedAt: stage === "Won" || stage === "Lost" ? new Date() : null },
    })
    return `deal.stage=${stage}`
  }
  return null
}

const runSendEmail = async (
  rule: Rule,
  record: Record<string, unknown>,
  params: Record<string, string>
): Promise<string | null> => {
  const templateId = params.templateId
  const email = String(record.email ?? "")
  if (!templateId || !email) return null

  await deliverEmail(
    {
      accountId: null,
      to: [email],
      cc: [],
      subject: rule.name,
      body: "",
      templateId,
      contactId: rule.triggerEntity === "contact" ? String(record.id) : null,
      leadId: rule.triggerEntity === "lead" ? String(record.id) : null,
    },
    "automation",
    "rep"
  )
  return `email→${email}`
}

const runSendNotification = async (
  rule: Rule,
  record: Record<string, unknown>,
  params: Record<string, string>
): Promise<string | null> => {
  const message = params.message || `Rule "${rule.name}" fired on ${String(record.id)}`
  const ownerId = String(record.ownerId ?? record.assigneeId ?? "")
  if (!ownerId) return null

  await prisma.notification.create({
    data: {
      userId: ownerId,
      title: rule.name,
      body: message,
    },
  })
  return `notification→${ownerId}`
}

/**
 * Evaluate rules for an entity+event against a record. Loads enabled rules,
 * filters by conditions, executes each action (isolated try/catch), and writes
 * an AutomationRun row. Returns the run summary.
 */
export const evaluate = async (input: {
  entity: TriggerEntity
  event: TriggerEvent
  record: Record<string, unknown>
  actorId?: string
  depth?: number
}): Promise<{ ruleId: string; matched: boolean; actions: number; errors: number }[]> => {
  const { entity, event, record, actorId = "automation", depth = 0 } = input
  if (depth >= MAX_DEPTH) return []

  const rules = await loadRules(entity, event)
  const results: { ruleId: string; matched: boolean; actions: number; errors: number }[] = []

  for (const rule of rules) {
    const matched = matchesAll(record, rule.conditions)
    let actionsRun = 0
    let errors = 0

    if (matched) {
      for (const action of rule.actions) {
        try {
          let executed: string | null = null
          switch (action.type) {
            case "create_task":
              executed = await runCreateTask(rule, record, actorId, action.params)
              break
            case "assign_owner":
              executed = await runAssignOwner(rule, record, action.params)
              break
            case "update_field":
              executed = await runUpdateField(rule, record, action.params)
              break
            case "move_stage":
              executed = await runMoveStage(rule, record, action.params)
              break
            case "send_email":
              executed = await runSendEmail(rule, record, action.params)
              break
            case "send_notification":
              executed = await runSendNotification(rule, record, action.params)
              break
          }
          if (executed) actionsRun++
        } catch (error) {
          errors++
          console.error(`[automation] rule ${rule.name} action ${action.type} failed`, error)
        }
      }

      // Always notify the record owner so a fired rule shows up in the bell,
      // even when the rule has no explicit send_notification action.
      const ownerId = String(record.ownerId ?? record.assigneeId ?? "")
      if (ownerId) {
        try {
          await prisma.notification.create({
            data: {
              userId: ownerId,
              title: `Rule fired: ${rule.name}`,
              body: `${rule.name} ran on ${entity} ${String(record.id ?? "")} (${actionsRun} action${actionsRun === 1 ? "" : "s"}).`,
            },
          })
          actionsRun++
        } catch (error) {
          console.error(`[automation] rule ${rule.name} notification failed`, error)
        }
      }
    }

    // Record a run row so history is real.
    try {
      await prisma.automationRun.create({
        data: {
          ruleId: rule.id,
          matched,
          context: {
            recordId: String(record.id ?? ""),
            entity,
            event,
            actionsRun,
            errors,
          } as unknown as Prisma.InputJsonValue,
          error: errors > 0 ? `${errors} action(s) failed` : null,
        },
      })
    } catch {
      // run history must never break evaluation
    }

    results.push({ ruleId: rule.id, matched, actions: actionsRun, errors })
  }

  return results
}
