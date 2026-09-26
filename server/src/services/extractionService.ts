import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { z } from "zod"
import type { UserRole } from "@prisma/client"

import { env, hasLlmConfig } from "@/config/env"
import { ApiError } from "@/lib/http"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

// ---------------------------------------------------------------- schema

/**
 * What Claude returns. Deliberately id-free: the model names records in natural
 * language via `targetHint` and we resolve that against the database ourselves.
 * A hallucinated foreign key is the most damaging failure mode here, and this
 * makes it structurally impossible rather than merely unlikely.
 */
export const extractionResultSchema = z.object({
  summary: z.string().max(200),
  changes: z
    .array(
      z.object({
        entity: z.enum(["contact", "lead", "deal", "task", "activity"]),
        action: z.enum([
          "create_record",
          "update_field",
          "move_stage",
          "change_status",
          "log_activity",
          "create_task",
        ]),
        label: z.string().max(80),
        targetHint: z.string().nullable(),
        field: z.string().nullable(),
        proposedValue: z.string().nullable(),
        evidence: z.string().max(500),
      })
    )
    .max(25),
})

export type ExtractionResult = z.infer<typeof extractionResultSchema>

export const extractionInputSchema = z.object({
  text: z.string().min(20, "Paste something longer to extract from").max(100_000),
  sourceLabel: z.string().max(120).default(""),
})

const SYSTEM = `You extract proposed CRM updates from unstructured text: email threads, chat exports, meeting notes and transcripts.

The CRM holds:
- contact — a person. Fields: name, jobTitle, email, phone, status (Active/Inactive/Pending).
- lead — an unqualified prospect. Fields: name, jobTitle, email, phone, companyName, status (new/contacted/qualified/unqualified/converted), estimatedValue, notes.
- deal — an opportunity. Fields: title, amount, stage (New/Contacted/Qualified/Negotiation/Won/Lost), expectedCloseDate, notes.
- task — follow-up work. Fields: title, description, priority (Low/Medium/High/Urgent), status (backlog/todo/in-progress/done), dueDate.
- activity — a logged interaction. Fields: type (call/email/meeting/note), summary, body.

Rules:
1. Propose only what the text supports. Never invent a phone number, amount, date or name that is not there. Fewer accurate proposals beat more speculative ones.
2. Every change must quote the exact span it came from in "evidence". If you cannot quote it, do not propose it.
3. Identify records by "targetHint" in natural language, e.g. "Sarah Chen at Acme" or "the Acme renewal deal". Never emit an id. Use null for a new record.
4. "label" is what a busy salesperson reads in a review queue: "Deal stage", "New stakeholder", "Follow-up task", "Phone number".
5. "proposedValue" is the new value as a plain string. For a create, the record's name or title.
6. Commitments and next steps become tasks. Things that already happened become activities.
7. Return an empty changes array if the text contains nothing actionable.`

// ---------------------------------------------------------------- client

let client: Anthropic | null = null

/**
 * Lazy so the app boots without a key; mirrors getS3() in documentsService.
 */
const getClient = (): Anthropic => {
  if (client) return client
  if (!hasLlmConfig) {
    throw ApiError.badRequest(
      "AI extraction is not configured — set ANTHROPIC_API_KEY"
    )
  }
  client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  return client
}

/** The seam the tests replace, so no test ever spends money or needs a key. */
export type Extractor = (text: string) => Promise<ExtractionResult>

export const claudeExtractor: Extractor = async (text) => {
  const response = await getClient().messages.parse({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    messages: [{ role: "user", content: text }],
    output_config: { format: zodOutputFormat(extractionResultSchema) },
  })

  if (response.stop_reason === "refusal") {
    throw ApiError.badRequest(
      "The model declined to process this text. Remove sensitive content and try again."
    )
  }

  if (!response.parsed_output) {
    throw ApiError.badRequest("Could not read structured changes from that text")
  }

  return response.parsed_output
}

// ---------------------------------------------------------------- resolution

type Resolved = { targetId: string | null; currentValue: string | null }

const norm = (value: string) => value.trim().toLowerCase()

/**
 * Turns a natural-language hint into a real record id, or leaves it null so the
 * reviewer is shown an explicit "needs a target" state. Never guesses between
 * two equally good matches — an ambiguous hint resolves to null.
 */
const resolveTarget = async (
  entity: ExtractionResult["changes"][number]["entity"],
  hint: string | null,
  field: string | null
): Promise<Resolved> => {
  if (!hint) return { targetId: null, currentValue: null }
  const needle = norm(hint)

  const pick = <T extends { id: string }>(rows: T[]): T | null =>
    rows.length === 1 ? rows[0]! : null

  if (entity === "contact") {
    const rows = await prisma.contact.findMany({
      where: { OR: [{ name: { contains: hint, mode: "insensitive" } }, { email: needle }] },
      take: 2,
    })
    const row = pick(rows)
    return {
      targetId: row?.id ?? null,
      currentValue: row && field ? stringifyField(row, field) : null,
    }
  }

  if (entity === "lead") {
    const rows = await prisma.lead.findMany({
      where: {
        deletedAt: null,
        OR: [{ name: { contains: hint, mode: "insensitive" } }, { email: needle }],
      },
      take: 2,
    })
    const row = pick(rows)
    return {
      targetId: row?.id ?? null,
      currentValue: row && field ? stringifyField(row, field) : null,
    }
  }

  if (entity === "deal") {
    const rows = await prisma.deal.findMany({
      where: { title: { contains: hint, mode: "insensitive" } },
      take: 2,
    })
    const row = pick(rows)
    return {
      targetId: row?.id ?? null,
      currentValue: row && field ? stringifyField(row, field) : null,
    }
  }

  if (entity === "task") {
    const rows = await prisma.task.findMany({
      where: { title: { contains: hint, mode: "insensitive" } },
      take: 2,
    })
    const row = pick(rows)
    return {
      targetId: row?.id ?? null,
      currentValue: row && field ? stringifyField(row, field) : null,
    }
  }

  // Activities are always created, never targeted.
  return { targetId: null, currentValue: null }
}

const stringifyField = (row: Record<string, unknown>, field: string): string | null => {
  const value = row[field]
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

// ---------------------------------------------------------------- service

/**
 * Runs an extraction and persists it with every change left `pending`. This
 * function writes nothing to any CRM record — that only happens on approval,
 * in proposalsService.
 */
export const createExtraction = async (
  input: unknown,
  currentUserId: string,
  _currentUserRole: UserRole,
  extract: Extractor = claudeExtractor
) => {
  const data = extractionInputSchema.parse(input)
  const result = await extract(data.text)

  const resolvedChanges = await Promise.all(
    result.changes.map(async (change) => {
      const { targetId, currentValue } = await resolveTarget(
        change.entity,
        change.targetHint,
        change.field
      )
      return {
        entity: change.entity,
        action: change.action,
        label: change.label,
        field: change.field,
        targetId,
        currentValue,
        proposedValue: change.proposedValue,
        evidence: change.evidence,
        payload: {
          targetHint: change.targetHint,
          field: change.field,
          value: change.proposedValue,
        },
      }
    })
  )

  const extraction = await prisma.extraction.create({
    data: {
      userId: currentUserId,
      sourceLabel: data.sourceLabel,
      rawText: data.text,
      summary: result.summary,
      changes: { create: resolvedChanges },
    },
    include: { changes: { orderBy: { createdAt: "asc" } } },
  })

  logger.info("Extraction created", {
    extractionId: extraction.id,
    changes: extraction.changes.length,
  })

  return extraction
}
