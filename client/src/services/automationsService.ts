import { apiRequest } from "./api"
import type { AutomationRule } from "@/types/crm"

export type RuleDraft = Omit<
  AutomationRule,
  "id" | "createdAt" | "updatedAt"
>

export interface AutomationRun {
  id: string
  ruleId: string
  ranAt: string
  matched: boolean
  context: unknown
  error?: string | null
}

export const getRules = async (): Promise<{ rules: AutomationRule[] }> =>
  apiRequest<{ rules: AutomationRule[] }>("/automations")

export const getRule = async (id: string): Promise<{ rule: AutomationRule }> =>
  apiRequest<{ rule: AutomationRule }>(`/automations/${id}`)

export const createRule = async (
  draft: Partial<AutomationRule>
): Promise<{ rule: AutomationRule }> =>
  apiRequest<{ rule: AutomationRule }>("/automations", {
    method: "POST",
    body: draft,
  })

export const updateRule = async (
  id: string,
  changes: Partial<AutomationRule>
): Promise<{ rule: AutomationRule }> =>
  apiRequest<{ rule: AutomationRule }>(`/automations/${id}`, {
    method: "PATCH",
    body: changes,
  })

export const toggleRule = async (
  id: string,
  enabled: boolean
): Promise<{ rule: AutomationRule }> =>
  apiRequest<{ rule: AutomationRule }>(`/automations/${id}/toggle`, {
    method: "PATCH",
    body: { enabled },
  })

export const testRule = async (
  id: string
): Promise<{ matched: number; conditions: number; actions: number; note: string }> =>
  apiRequest<{ matched: number; conditions: number; actions: number; note: string }>(
    `/automations/${id}/test`,
    { method: "POST" }
  )

export const getRuleRuns = async (
  id: string
): Promise<{ runs: AutomationRun[] }> =>
  apiRequest<{ runs: AutomationRun[] }>(`/automations/${id}/runs`)

export const clearRuleRuns = async (id: string): Promise<void> =>
  apiRequest<void>(`/automations/${id}/runs`, { method: "DELETE" })

export const deleteRule = async (id: string): Promise<void> =>
  apiRequest<void>(`/automations/${id}`, { method: "DELETE" })
