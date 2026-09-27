import OpenAI from "openai"
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

let client: OpenAI | null = null

/**
 * Lazy so the app boots without a key; mirrors getS3() in documentsService.
 * OpenRouter speaks the OpenAI wire format, so the official SDK works against
 * it with only a base URL change — and swapping model is then an env var.
 */
const getClient = (): OpenAI => {
  if (client) return client
  if (!hasLlmConfig) {
    throw ApiError.badRequest(
      "AI extraction is not configured — set OPENROUTER_API_KEY"
    )
  }
  client = new OpenAI({
    apiKey: env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  })
  return client
}

/**
 * Standard JSON Schema, straight from the Zod definition, so the extraction
 * contract and the validator below can never drift. `$schema` is stripped
 * because strict structured-output validators reject unknown top-level keys.
 */
const responseJsonSchema = (): Record<string, unknown> => {
  const schema = z.toJSONSchema(extractionResultSchema) as Record<string, unknown>
  delete schema.$schema
  return schema
}

/**
 * Enough for 25 changes with evidence, and far below any model's ceiling.
 *
 * This must be set explicitly. Left unset, OpenRouter reserves the model's
 * entire output window — 65k on some — and checks your balance against that
 * reservation, so a free or low balance is rejected before a single token is
 * generated ("you requested up to 65536 tokens, but can only afford 1933").
 */
const MAX_OUTPUT_TOKENS = 4096

/** The seam the tests replace, so no test ever spends money or needs a key. */
export type Extractor = (text: string) => Promise<ExtractionResult>

export const openRouterExtractor: Extractor = async (text) => {
  // Resolve the client first: a missing key is a configuration error, not a
  // request failure, and must not be re-wrapped or logged as one.
  const openai = getClient()
  const schema = responseJsonSchema()

  const models = env.OPENROUTER_MODEL.split(",")
    .map((m) => m.trim())
    .filter(Boolean)

  let lastError: unknown
  for (const model of models) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          {
            role: "system",
            content: `${SYSTEM}

Return JSON matching this schema:
${JSON.stringify(schema)}`,
          },
          { role: "user", content: text },
        ],
        // json_object rather than a strict json_schema: it is the mode every
        // capable free model supports, the schema is in the prompt anyway, and
        // the reply is re-validated below regardless.
        response_format: { type: "json_object" },
      })

      const raw = completion.choices?.[0]?.message?.content
      if (!raw) {
        // Typically a reasoning model that spent max_tokens thinking.
        throw new Error("model returned no content")
      }

      // Re-validate: a schema hint is never a guarantee, least of all here,
      // where a mis-routed model may return prose or a safety verdict.
      const result = extractionResultSchema.safeParse(JSON.parse(raw))
      if (!result.success) {
        throw new Error(
          `response did not match the expected shape: ${result.error.issues[0]?.message ?? "unknown"}`
        )
      }

      logger.info("Extraction succeeded", { model, changes: result.data.changes.length })
      return result.data
    } catch (error) {
      if (error instanceof ApiError) throw error
      lastError = error
      logger.warn("Extraction model failed, trying the next", {
        model,
        detail: error instanceof Error ? error.message.slice(0, 200) : String(error),
      })
    }
  }

  // Provider failures are usually operator-actionable — an unknown model, no
  // credit, a rate limit — so surface the provider's own message rather than
  // a generic 500 that costs a log dig every time.
  const detail = lastError instanceof Error ? lastError.message : String(lastError)
  logger.error("Every extraction model failed", { models, detail })
  throw ApiError.badRequest(`AI extraction failed: ${extractProviderMessage(detail)}`)
}

/** The SDK stringifies a JSON error body; pull out the human-readable part. */
const extractProviderMessage = (detail: string): string => {
  try {
    const parsed = JSON.parse(detail) as { error?: { message?: string } }
    if (parsed.error?.message) return parsed.error.message
  } catch {
    // Not JSON — fall through to the raw text.
  }
  return detail.slice(0, 300)
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
  extract: Extractor = openRouterExtractor
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
