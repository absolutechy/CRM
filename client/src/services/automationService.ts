import type { AutomationRule } from "@/types/crm"
import { pendingBackend, type ServiceResult } from "./types"

/**
 * Rules are authored and stored client-side, but nothing executes them — the
 * evaluation engine belongs on the backend so it can run on schedules and
 * server-side events, not only while a browser tab is open.
 *
 * TODO(backend): PUT the rule to `/api/automations` so the engine registers it.
 */
export const publishRule = async (
  _rule: AutomationRule
): Promise<ServiceResult> =>
  pendingBackend(
    "This rule is saved but won't run until the automation backend is connected."
  )

/** TODO(backend): dry-run a rule against current data and return matches. */
export const testRule = async (
  _rule: AutomationRule
): Promise<ServiceResult<number>> =>
  pendingBackend("Testing a rule requires the automation backend.")

/** TODO(backend): fetch execution history for the rule detail page. */
export const fetchRunHistory = async (
  _ruleId: string
): Promise<ServiceResult<never[]>> =>
  pendingBackend("Run history becomes available once the engine is connected.")
