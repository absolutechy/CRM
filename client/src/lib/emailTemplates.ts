import type { Contact, Lead, User } from "@/types/crm"

/**
 * Token substitution for email templates. Kept deliberately simple — the same
 * `{{token}}` shape a mail backend would expand server-side later.
 */

export interface TemplateContext {
  contact?: Contact | Lead
  companyName?: string
  sender?: User
}

const firstNameOf = (name?: string) => (name ?? "").split(" ")[0] ?? ""

export const TEMPLATE_TOKENS = [
  { token: "{{firstName}}", label: "Recipient first name" },
  { token: "{{fullName}}", label: "Recipient full name" },
  { token: "{{company}}", label: "Recipient company" },
  { token: "{{jobTitle}}", label: "Recipient job title" },
  { token: "{{senderName}}", label: "Your name" },
]

export const applyTemplate = (text: string, ctx: TemplateContext): string => {
  const recipient = ctx.contact
  const values: Record<string, string> = {
    "{{firstName}}": firstNameOf(recipient?.name),
    "{{fullName}}": recipient?.name ?? "",
    "{{company}}": ctx.companyName ?? "",
    "{{jobTitle}}": recipient?.jobTitle ?? "",
    "{{senderName}}": ctx.sender?.name ?? "",
  }

  return Object.entries(values).reduce(
    (out, [token, value]) => out.split(token).join(value),
    text
  )
}

/** Highlights any tokens that couldn't be resolved, for composer warnings. */
export const unresolvedTokens = (text: string): string[] =>
  Array.from(new Set(text.match(/\{\{[a-zA-Z]+\}\}/g) ?? []))
