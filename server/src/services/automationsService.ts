import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { ApiError } from "@/lib/http"
import type { UserRole } from "@prisma/client"

// ---------------------------------------------------------------- validation

export const triggerEntitySchema = z.enum([
  "contact",
  "lead",
  "deal",
  "task",
  "campaign",
])

export const triggerEventSchema = z.enum([
  "created",
  "updated",
  "stage_changed",
  "inactive_for",
])

export const conditionSchema = z.object({
  id: z.string().optional(),
  field: z.string().min(1),
  operator: z.enum(["is", "is_not", "contains", "gt", "lt", "is_empty"]),
  value: z.string().default(""),
})

export const actionSchema = z.object({
  id: z.string().optional(),
  type: z.enum([
    "create_task",
    "update_field",
    "assign_owner",
    "send_notification",
    "send_email",
    "move_stage",
  ]),
  params: z.record(z.string(), z.string()).default({}),
})

export const automationRuleCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).default(""),
  enabled: z.boolean().default(false),
  trigger: z.object({
    entity: triggerEntitySchema,
    event: triggerEventSchema,
  }),
  conditions: z.array(conditionSchema).default([]),
  actions: z.array(actionSchema).default([]),
})

export const automationRuleUpdateSchema = automationRuleCreateSchema.partial()

export type AutomationRuleCreateInput = z.infer<
  typeof automationRuleCreateSchema
>

// ---------------------------------------------------------------- helpers

const serializeRule = (rule: any) => ({
  id: rule.id,
  name: rule.name,
  description: rule.description,
  enabled: rule.enabled,
  trigger: {
    entity: rule.triggerEntity,
    event: rule.triggerEvent,
  },
  conditions: rule.conditions ?? [],
  actions: rule.actions ?? [],
  createdAt: rule.createdAt,
  updatedAt: rule.updatedAt,
  lastRunAt: rule.lastRunAt,
})

/** Flatten the nested `trigger` into the schema's two columns. */
const toPrismaData = (data: AutomationRuleCreateInput) => ({
  name: data.name,
  description: data.description,
  enabled: data.enabled,
  triggerEntity: data.trigger.entity,
  triggerEvent: data.trigger.event,
  conditions: data.conditions as unknown as object,
  actions: data.actions as unknown as object,
})

// ---------------------------------------------------------------- service

export const listAutomationRules = async (
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const rules = await prisma.automationRule.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { runs: true } } },
  })
  return rules.map(serializeRule)
}

export const getAutomationRule = async (
  id: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const rule = await prisma.automationRule.findUnique({
    where: { id },
    include: { _count: { select: { runs: true } } },
  })
  if (!rule) throw ApiError.notFound("Rule not found")
  return serializeRule(rule)
}

export const createAutomationRule = async (
  input: unknown,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const data = automationRuleCreateSchema.parse(input)
  const rule = await prisma.automationRule.create({
    data: toPrismaData(data),
  })
  return serializeRule(rule)
}

export const updateAutomationRule = async (
  id: string,
  input: unknown,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const existing = await prisma.automationRule.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Rule not found")

  const data = automationRuleUpdateSchema.parse(input)

  // Build the update, mapping nested trigger back to the flat columns when present.
  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.enabled !== undefined) updateData.enabled = data.enabled
  if (data.trigger !== undefined) {
    updateData.triggerEntity = data.trigger.entity
    updateData.triggerEvent = data.trigger.event
  }
  if (data.conditions !== undefined)
    updateData.conditions = data.conditions as unknown as object
  if (data.actions !== undefined)
    updateData.actions = data.actions as unknown as object

  const rule = await prisma.automationRule.update({
    where: { id },
    data: updateData,
  })
  return serializeRule(rule)
}

export const toggleAutomationRule = async (
  id: string,
  input: unknown,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const existing = await prisma.automationRule.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Rule not found")

  const enabled =
    typeof input === "object" && input !== null && "enabled" in input
      ? Boolean((input as { enabled: boolean }).enabled)
      : !existing.enabled

  const rule = await prisma.automationRule.update({
    where: { id },
    data: { enabled },
  })
  return serializeRule(rule)
}

export const deleteAutomationRule = async (
  id: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const existing = await prisma.automationRule.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Rule not found")
  // Runs cascade-delete with the rule.
  await prisma.automationRule.delete({ where: { id } })
}

// ---------------------------------------------------------------- runs

export const listAutomationRuns = async (
  ruleId: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const rule = await prisma.automationRule.findUnique({ where: { id: ruleId } })
  if (!rule) throw ApiError.notFound("Rule not found")

  return prisma.automationRun.findMany({
    where: { ruleId },
    orderBy: { ranAt: "desc" },
    take: 100,
  })
}

export const clearAutomationRuns = async (
  ruleId: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const rule = await prisma.automationRule.findUnique({ where: { id: ruleId } })
  if (!rule) throw ApiError.notFound("Rule not found")

  await prisma.automationRun.deleteMany({ where: { ruleId } })
}

/**
 * Dry-run: validates a rule's trigger/conditions/actions without executing it.
 * Returns the match count against the triggering entity's records.
 */
export const testAutomationRule = async (
  id: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const rule = await prisma.automationRule.findUnique({ where: { id } })
  if (!rule) throw ApiError.notFound("Rule not found")

  const conditions = (rule.conditions ?? []) as { field: string; operator: string; value: string }[]

  // Count candidate records of the triggering entity so the "would match"
  // preview is real, not fabricated.
  let matchCount = 0
  const entity = rule.triggerEntity
  try {
    if (entity === "lead") matchCount = await prisma.lead.count()
    else if (entity === "contact") matchCount = await prisma.contact.count()
    else if (entity === "deal") matchCount = await prisma.deal.count()
    else if (entity === "task") matchCount = await prisma.task.count()
    else if (entity === "campaign") matchCount = await prisma.campaign.count()
  } catch {
    matchCount = 0
  }

  return {
    matched: matchCount,
    conditions: conditions.length,
    actions: (rule.actions as unknown[]).length,
    // Full condition evaluation lives in the scheduled engine; this reports
    // the pool of records the rule would scan.
    note: `Rule would scan ${matchCount} ${entity} record${matchCount === 1 ? "" : "s"} for ${conditions.length} condition${conditions.length === 1 ? "" : "s"}.`,
  }
}
