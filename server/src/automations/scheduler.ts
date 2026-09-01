import cron from "node-cron"

import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { evaluate } from "./engine"

/** How often the time-based worker scans for inactive records. */
const SCAN_CRON = "*/5 * * * *" // every 5 minutes

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000)

/**
 * Fires `inactive_for` rules: enabled rules with a `daysInactive` condition on
 * leads/contacts/deals get evaluated against records whose last activity is
 * older than the threshold. Runs in-process on a cron schedule (long-running
 * hosts) or via the /api/automations/run endpoint (serverless cron).
 */
export const scanInactiveRecords = async (): Promise<void> => {
  try {
    const rules = await prisma.automationRule.findMany({
      where: { enabled: true, triggerEvent: "inactive_for" },
    })

    for (const rule of rules) {
      const entity = rule.triggerEntity
      const conditions = (rule.conditions ?? []) as {
        field: string
        operator: string
        value: string
      }[]
      const daysCond = conditions.find((c) => c.field === "daysInactive")
      const days = Number(daysCond?.value ?? 0) || 7
      const since = daysAgo(days)

      if (entity === "lead") {
        const leads = await prisma.lead.findMany({
          where: { deletedAt: null, updatedAt: { lt: since } },
        })
        for (const lead of leads) {
          await evaluate({ entity: "lead", event: "inactive_for", record: lead as unknown as Record<string, unknown> })
        }
      } else if (entity === "contact") {
        const contacts = await prisma.contact.findMany({
          where: { updatedAt: { lt: since } },
        })
        for (const contact of contacts) {
          await evaluate({ entity: "contact", event: "inactive_for", record: contact as unknown as Record<string, unknown> })
        }
      } else if (entity === "deal") {
        const deals = await prisma.deal.findMany({
          where: { updatedAt: { lt: since } },
        })
        for (const deal of deals) {
          await evaluate({ entity: "deal", event: "inactive_for", record: deal as unknown as Record<string, unknown> })
        }
      }
    }
  } catch (error) {
    logger.error("Automation inactive scan failed", { error })
  }
}

let started = false

/** Starts the in-process automation worker. Safe to call once. */
export const startAutomationScheduler = (): void => {
  if (started) return
  started = true

  cron.schedule(SCAN_CRON, () => {
    void scanInactiveRecords()
  })

  logger.info(`Automation scheduler started (cron: ${SCAN_CRON})`)
}
