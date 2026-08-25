import { z } from "zod"
import nodemailer from "nodemailer"

import { env, hasMailConfig } from "@/config/env"
import { prisma } from "@/lib/prisma"
import { ApiError } from "@/lib/http"
import type { UserRole } from "@prisma/client"

// ---------------------------------------------------------------- validation

export const emailTemplateCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  subject: z.string().min(1).max(300),
  body: z.string().max(100_000).default(""),
  category: z.string().max(100).default("General"),
})

export const emailTemplateUpdateSchema = emailTemplateCreateSchema.partial()

export const sendEmailSchema = z.object({
  accountId: z.string().cuid().nullable().default(null),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).default([]),
  subject: z.string().min(1).max(300),
  body: z.string().max(100_000).default(""),
  contactId: z.string().cuid().nullable().default(null),
  leadId: z.string().cuid().nullable().default(null),
  companyId: z.string().cuid().nullable().default(null),
  templateId: z.string().cuid().nullable().default(null),
})

export type SendEmailInput = z.infer<typeof sendEmailSchema>

// ---------------------------------------------------------------- templates

export const listEmailTemplates = async (
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  return prisma.emailTemplate.findMany({
    select: {
      id: true,
      name: true,
      subject: true,
      body: true,
      category: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  })
}

export const createEmailTemplate = async (
  input: unknown,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const data = emailTemplateCreateSchema.parse(input)
  return prisma.emailTemplate.create({ data })
}

export const updateEmailTemplate = async (
  id: string,
  input: unknown,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const existing = await prisma.emailTemplate.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Template not found")
  const data = emailTemplateUpdateSchema.parse(input)
  return prisma.emailTemplate.update({ where: { id }, data })
}

export const deleteEmailTemplate = async (
  id: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const existing = await prisma.emailTemplate.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Template not found")
  await prisma.emailTemplate.delete({ where: { id } })
}

// ---------------------------------------------------------------- accounts

/**
 * Ensures an EmailAccount row exists for the SMTP account configured in env,
 * so the account shows up in the UI (and can be picked as the sender) without
 * a separate setup step. No-op when SMTP isn't configured.
 */
export const provisionAccountFromEnv = async (): Promise<void> => {
  if (!hasMailConfig || !env.SMTP_USER) return

  // Derive a display name from MAIL_FROM ("Name <email>") or fall back to the
  // SMTP user's local part.
  const mailFromMatch = /^"?([^"<]+)"?\s*</.exec(env.MAIL_FROM || "")
  const displayName = mailFromMatch?.[1]?.trim() || env.SMTP_USER.split("@")[0] || "Mailbox"
  const address = env.SMTP_USER.toLowerCase()

  await prisma.emailAccount.upsert({
    where: { address },
    update: {
      displayName,
      connected: true,
      provider: "imap",
    },
    create: {
      address,
      displayName,
      connected: true,
      provider: "imap",
    },
  })
}

export const listEmailAccounts = async (
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  // Make sure the SMTP-configured account exists before listing.
  await provisionAccountFromEnv()

  const accounts = await prisma.emailAccount.findMany({
    select: {
      id: true,
      address: true,
      provider: true,
      displayName: true,
      connected: true,
      lastSyncedAt: true,
    },
    orderBy: { address: "asc" },
  })
  return accounts
}

export const createEmailAccountSchema = z.object({
  displayName: z.string().min(1).max(120),
  address: z.string().email(),
  provider: z.enum(["gmail", "outlook", "imap"]).default("imap"),
  host: z.string().min(1).max(200),
  port: z.number().int().positive().default(587),
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(500),
})

/** Adds a new SMTP account. Credentials are stored in the never-returned
 *  `credentials` Json field so the client only ever sees safe metadata. */
export const createEmailAccount = async (
  input: unknown,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const data = createEmailAccountSchema.parse(input)
  const address = data.address.toLowerCase()

  const existing = await prisma.emailAccount.findUnique({ where: { address } })
  if (existing) throw ApiError.conflict("An account with this address already exists")

  const account = await prisma.emailAccount.create({
    data: {
      address,
      provider: data.provider,
      displayName: data.displayName,
      connected: true,
      // Never exposed by the API — used by sendEmail at delivery time.
      credentials: {
        host: data.host,
        port: data.port,
        username: data.username,
        password: data.password,
      },
    },
    select: {
      id: true,
      address: true,
      provider: true,
      displayName: true,
      connected: true,
      lastSyncedAt: true,
    },
  })

  return account
}

export const syncEmailAccount = async (
  id: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const account = await prisma.emailAccount.findUnique({ where: { id } })
  if (!account) throw ApiError.notFound("Account not found")
  if (!account.connected) {
    throw ApiError.badRequest("Account is not connected")
  }

  // Real IMAP sync is provider-specific work; for now stamp the sync time so
  // the UI reflects a completed sync cycle.
  return prisma.emailAccount.update({
    where: { id },
    data: { lastSyncedAt: new Date() },
    select: {
      id: true,
      address: true,
      provider: true,
      displayName: true,
      connected: true,
      lastSyncedAt: true,
    },
  })
}

// ---------------------------------------------------------------- messages

export const listEmails = async (
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  return prisma.emailMessage.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      contact: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } },
    },
  })
}

export const listEmailsByContact = async (
  contactId: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  return prisma.emailMessage.findMany({
    where: { contactId },
    orderBy: { createdAt: "desc" },
  })
}

// ---------------------------------------------------------------- send

/**
 * Sends an email. When SMTP is configured the message is actually delivered
 * and recorded as `sent`; otherwise it is recorded as a `draft` with a clear
 * message so the UI never claims a message was sent when it wasn't.
 */
export const sendEmail = async (
  input: unknown,
  currentUserId: string,
  _currentUserRole: UserRole
) => {
  const data = sendEmailSchema.parse(input)

  // Validate the linked records exist.
  if (data.contactId) {
    const contact = await prisma.contact.findUnique({ where: { id: data.contactId } })
    if (!contact) throw ApiError.badRequest("Contact not found")
  }
  if (data.leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: data.leadId } })
    if (!lead) throw ApiError.badRequest("Lead not found")
  }
  if (data.templateId) {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: data.templateId },
    })
    if (!template) throw ApiError.badRequest("Template not found")
  }

  // Resolve the from address + SMTP settings for the selected account.
  let from = env.MAIL_FROM || "CRM <no-reply@example.com>"
  let smtp: {
    host: string
    port: number
    secure: boolean
    user?: string
    pass?: string
  } | null = hasMailConfig
    ? {
        host: env.SMTP_HOST!,
        port: env.SMTP_PORT ?? 587,
        secure: (env.SMTP_PORT ?? 587) === 465,
        user: env.SMTP_USER ?? undefined,
        pass: env.SMTP_PASSWORD ?? undefined,
      }
    : null

  if (data.accountId) {
    const account = await prisma.emailAccount.findUnique({
      where: { id: data.accountId },
    })
    if (!account) throw ApiError.badRequest("Account not found")
    from = `"${account.displayName}" <${account.address}>`

    // Per-account SMTP credentials (stored in the never-returned Json field)
    // take priority over the global env config.
    const creds = (account.credentials ?? {}) as {
      host?: string
      port?: number
      username?: string
      password?: string
    }
    if (creds.host) {
      smtp = {
        host: creds.host,
        port: creds.port ?? 587,
        secure: (creds.port ?? 587) === 465,
        user: creds.username,
        pass: creds.password,
      }
    }
  }

  let status: "sent" | "draft" = "sent"
  let message = "Email sent"

  if (smtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: smtp.user
          ? { user: smtp.user, pass: smtp.pass ?? "" }
          : undefined,
      })
      await transporter.sendMail({
        from,
        to: data.to,
        cc: data.cc,
        subject: data.subject,
        html: data.body,
      })
      status = "sent"
    } catch (error) {
      // Delivery failed — record as draft so nothing is falsely claimed sent.
      status = "draft"
      message = `SMTP delivery failed: ${error instanceof Error ? error.message : "unknown error"}`
    }
  } else {
    // SMTP not configured — record as a draft and be honest about it.
    status = "draft"
    message =
      "SMTP is not configured — the email was saved as a draft, not sent."
  }

  const email = await prisma.emailMessage.create({
    data: {
      accountId: data.accountId,
      contactId: data.contactId,
      leadId: data.leadId,
      companyId: data.companyId,
      subject: data.subject,
      body: data.body,
      from,
      to: data.to,
      cc: data.cc,
      templateId: data.templateId,
      status,
      sentAt: status === "sent" ? new Date() : null,
    },
  })

  // Log an outbound activity on the interaction timeline so it shows up in
  // contact/lead/company history.
  await prisma.activity.create({
    data: {
      contactId: data.contactId,
      leadId: data.leadId,
      companyId: data.companyId,
      type: "email",
      status: "logged",
      direction: "outbound",
      summary: `Email: ${data.subject}`,
      body: data.body.slice(0, 2000),
      at: new Date(),
      actorId: currentUserId,
    },
  })

  return { email, message, sent: status === "sent" }
}

// ---------------------------------------------------------------- drafts

export const saveDraft = async (
  input: unknown,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const data = sendEmailSchema.parse(input)

  const email = await prisma.emailMessage.create({
    data: {
      accountId: data.accountId,
      contactId: data.contactId,
      leadId: data.leadId,
      companyId: data.companyId,
      subject: data.subject,
      body: data.body,
      from: env.MAIL_FROM || "CRM <no-reply@example.com>",
      to: data.to,
      cc: data.cc,
      templateId: data.templateId,
      status: "draft",
    },
  })
  return email
}

export const deleteDraft = async (
  id: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const existing = await prisma.emailMessage.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Draft not found")
  await prisma.emailMessage.delete({ where: { id } })
}
