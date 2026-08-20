import type { EmailAccount, EmailMessage } from "@/types/crm"
import { pendingBackend, type ServiceResult } from "./types"

export interface SendEmailInput {
  accountId: string | null
  to: string[]
  cc: string[]
  subject: string
  body: string
  contactId?: string | null
  leadId?: string | null
  templateId?: string | null
}

/**
 * Sending is not wired up — there is no mail backend yet.
 *
 * TODO(backend): POST the payload to `/api/emails/send`. On success, dispatch
 * `emailRecorded(result.data)` and `activityLogged({ type: "email",
 * direction: "outbound", contactId, companyId })` so sent mail lands in the
 * interaction timeline. Both call sites are ready for it.
 */
export const sendEmail = async (
  _input: SendEmailInput
): Promise<ServiceResult<EmailMessage>> =>
  pendingBackend(
    "Email sending isn't connected yet. Your draft has not been sent."
  )

/**
 * TODO(backend): kick off the provider OAuth flow and persist the returned
 * tokens, then flip `connected` on the account.
 */
export const connectAccount = async (
  _account: EmailAccount
): Promise<ServiceResult> =>
  pendingBackend(
    "Mailbox connection requires the backend. No account has been linked."
  )

/** TODO(backend): pull new mail for a connected account. */
export const syncAccount = async (_accountId: string): Promise<ServiceResult> =>
  pendingBackend("Mailbox sync requires the backend.")
