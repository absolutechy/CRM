import { apiRequest } from "./api"
import type { EmailAccount, EmailMessage, EmailTemplate } from "@/types/crm"

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

export interface SendEmailResult {
  email: EmailMessage
  message: string
  sent: boolean
}

/** POST /api/emails/send — delivers (or saves-as-draft when SMTP is off). */
export const sendEmail = async (
  input: SendEmailInput
): Promise<SendEmailResult> => {
  const result = await apiRequest<SendEmailResult>("/emails/send", {
    method: "POST",
    body: input,
  })
  return result
}

// ---- templates

export const getTemplates = async (): Promise<{ templates: EmailTemplate[] }> =>
  apiRequest<{ templates: EmailTemplate[] }>("/emails/templates")

export const createTemplate = async (
  draft: Partial<EmailTemplate>
): Promise<{ template: EmailTemplate }> =>
  apiRequest<{ template: EmailTemplate }>("/emails/templates", {
    method: "POST",
    body: draft,
  })

export const updateTemplate = async (
  id: string,
  changes: Partial<EmailTemplate>
): Promise<{ template: EmailTemplate }> =>
  apiRequest<{ template: EmailTemplate }>(`/emails/templates/${id}`, {
    method: "PATCH",
    body: changes,
  })

export const deleteTemplate = async (id: string): Promise<void> =>
  apiRequest<void>(`/emails/templates/${id}`, { method: "DELETE" })

// ---- accounts

export const getAccounts = async (): Promise<{ accounts: EmailAccount[] }> =>
  apiRequest<{ accounts: EmailAccount[] }>("/emails/accounts")

export interface NewAccountInput {
  displayName: string
  address: string
  provider: EmailAccount["provider"]
  host: string
  port: number
  username: string
  password: string
}

export const createAccount = async (
  input: NewAccountInput
): Promise<{ account: EmailAccount }> =>
  apiRequest<{ account: EmailAccount }>("/emails/accounts", {
    method: "POST",
    body: input,
  })

export const syncAccount = async (accountId: string): Promise<{ account: EmailAccount }> =>
  apiRequest<{ account: EmailAccount }>(`/emails/accounts/${accountId}/sync`, {
    method: "POST",
  })

// ---- messages

export const getEmails = async (): Promise<{ emails: EmailMessage[] }> =>
  apiRequest<{ emails: EmailMessage[] }>("/emails")

export const getEmailsByContact = async (
  contactId: string
): Promise<{ emails: EmailMessage[] }> =>
  apiRequest<{ emails: EmailMessage[] }>(`/emails/contact/${contactId}`)

// ---- drafts

export const saveDraft = async (
  draft: SendEmailInput
): Promise<{ draft: EmailMessage }> =>
  apiRequest<{ draft: EmailMessage }>("/emails/drafts", {
    method: "POST",
    body: draft,
  })

export const deleteDraft = async (id: string): Promise<void> =>
  apiRequest<void>(`/emails/drafts/${id}`, { method: "DELETE" })
