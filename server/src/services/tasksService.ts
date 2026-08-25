import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { ApiError } from "@/lib/http"
import type { TaskStatus as PrismaTaskStatus, UserRole } from "@prisma/client"
import { canAccessAllRecords, assertOwnsRecord } from "@/lib/ownership"
import { evaluate } from "@/automations/engine"

// ---------------------------------------------------------------- validation

export const taskPrioritySchema = z.enum(["Low", "Medium", "High", "Urgent"])

export const taskStatusSchema = z.enum([
  "backlog",
  "todo",
  "in-progress",
  "done",
])

/** Prisma's enum is `in_progress` (DB-mapped to "in-progress"); the API uses the
 *  kebab-case value. Convert wire → Prisma before writing. */
const toPrismaStatus = (status: string): PrismaTaskStatus =>
  (status === "in-progress" ? "in_progress" : status) as PrismaTaskStatus

/** Prisma → API: kebab-case for the client. */
const toApiStatus = (status: string) =>
  status === "in_progress" ? "in-progress" : status

const serializeTask = (task: any) => ({
  ...task,
  status: toApiStatus(task.status),
})

const checklistItemSchema = z.object({
  id: z.string().optional(),
  text: z.string().max(300).default(""),
  completed: z.boolean().default(false),
})

const checklistSchema = z.object({
  id: z.string().optional(),
  title: z.string().max(200).default(""),
  items: z.array(checklistItemSchema).default([]),
})

const commentSchema = z.object({
  id: z.string().optional(),
  text: z.string().max(2000).default(""),
  timestamp: z.string().datetime().optional(),
})

const attachmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().max(200).default(""),
  url: z.string().max(500).default(""),
  type: z.string().max(100).default(""),
})

export const taskCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).default(""),
  priority: taskPrioritySchema.default("Medium"),
  status: taskStatusSchema.default("todo"),
  assigneeId: z.string().cuid().nullable().default(null),
  dueDate: z.string().datetime().nullable().default(null),
  contactId: z.string().cuid().nullable().default(null),
  leadId: z.string().cuid().nullable().default(null),
  dealId: z.string().cuid().nullable().default(null),
  checklists: z.array(checklistSchema).default([]),
  comments: z.array(commentSchema).default([]),
  attachments: z.array(attachmentSchema).default([]),
})

export const taskUpdateSchema = taskCreateSchema.partial()

/** Status-only payload for the kanban drag-and-drop. */
export const taskStatusChangeSchema = z.object({
  status: taskStatusSchema,
})

export type TaskCreateInput = z.infer<typeof taskCreateSchema>
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>

export interface TaskFilters {
  status?: string
  assigneeId?: string
  contactId?: string
  leadId?: string
  dealId?: string
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  order?: "asc" | "desc"
}

// ---------------------------------------------------------------- helpers

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

// ---------------------------------------------------------------- service

export const listTasks = async (
  filters: TaskFilters,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const {
    status,
    assigneeId,
    contactId,
    leadId,
    dealId,
    search,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    sortBy = "createdAt",
    order = "desc",
  } = filters

  const take = Math.min(
    Math.max(Number(pageSize) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  )
  const skip = ((Math.max(Number(page), 1) || DEFAULT_PAGE) - 1) * take

  const where: any = {}

  // Ownership: reps see only their own (assigned) tasks; managers/admins see all.
  if (!canAccessAllRecords({ id: currentUserId, role: currentUserRole })) {
    where.assigneeId = currentUserId
  } else if (assigneeId) {
    where.assigneeId = assigneeId
  }

  if (status) where.status = status
  if (contactId) where.contactId = contactId
  if (leadId) where.leadId = leadId
  if (dealId) where.dealId = dealId

  if (search?.trim()) {
    const q = search.trim()
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip,
      take,
      include: {
        assignee: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        checklists: { include: { items: true } },
        comments: true,
        attachments: true,
      },
    }),
  ])

  return {
    tasks: tasks.map(serializeTask),
    total,
    page: Math.max(Number(page), 1) || DEFAULT_PAGE,
    pageSize: take,
    totalPages: Math.max(1, Math.ceil(total / take)),
  }
}

export const getTask = async (
  id: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true } },
      checklists: { include: { items: true } },
      comments: true,
      attachments: true,
    },
  })

  if (!task) throw ApiError.notFound("Task not found")
  assertOwnsRecord({ id: currentUserId, role: currentUserRole }, task.assigneeId)

  return serializeTask(task)
}

export const createTask = async (
  input: unknown,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const data = taskCreateSchema.parse(input)

  // Reps can only create tasks for themselves.
  const assigneeId =
    currentUserRole === "rep" ? currentUserId : data.assigneeId ?? currentUserId

  if (assigneeId && currentUserRole !== "rep") {
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } })
    if (!assignee) throw ApiError.badRequest("Assignee not found")
  }
  if (data.contactId) {
    const contact = await prisma.contact.findUnique({ where: { id: data.contactId } })
    if (!contact) throw ApiError.badRequest("Contact not found")
  }
  if (data.leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: data.leadId } })
    if (!lead) throw ApiError.badRequest("Lead not found")
  }
  if (data.dealId) {
    const deal = await prisma.deal.findUnique({ where: { id: data.dealId } })
    if (!deal) throw ApiError.badRequest("Deal not found")
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: toPrismaStatus(data.status),
      assigneeId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      contactId: data.contactId,
      leadId: data.leadId,
      dealId: data.dealId,
      checklists: {
        create: data.checklists.map((c) => ({
          title: c.title,
          items: { create: c.items.map((i) => ({ text: i.text, completed: i.completed })) },
        })),
      },
      comments: {
        create: data.comments.map((c) => ({
          text: c.text,
          authorId: currentUserId,
        })),
      },
      attachments: {
        create: data.attachments.map((a) => ({
          name: a.name,
          url: a.url,
          type: a.type,
        })),
      },
    },
    include: {
      assignee: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true } },
      checklists: { include: { items: true } },
      comments: true,
      attachments: true,
    },
  })

  // Fire automation rules for task creation.
  await evaluate({
    entity: "task",
    event: "created",
    record: task as unknown as Record<string, unknown>,
    actorId: currentUserId,
  })

  return serializeTask(task)
}

export const updateTask = async (
  id: string,
  input: unknown,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const existing = await prisma.task.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Task not found")
  assertOwnsRecord({ id: currentUserId, role: currentUserRole }, existing.assigneeId)

  const data = taskUpdateSchema.parse(input)

  // Reps cannot reassign a task to another user.
  if (currentUserRole === "rep" && data.assigneeId && data.assigneeId !== currentUserId) {
    throw ApiError.forbidden("You cannot reassign this task")
  }

  if (data.assigneeId && currentUserRole !== "rep") {
    const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId } })
    if (!assignee) throw ApiError.badRequest("Assignee not found")
  }

  // Update the task scalar fields first.
  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.status !== undefined && {
        status: toPrismaStatus(data.status),
        completedAt:
          data.status === "done"
            ? existing.completedAt ?? new Date()
            : null,
      }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
      ...(data.dueDate !== undefined && {
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }),
      ...(data.contactId !== undefined && { contactId: data.contactId }),
      ...(data.leadId !== undefined && { leadId: data.leadId }),
      ...(data.dealId !== undefined && { dealId: data.dealId }),
    },
    include: {
      assignee: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true } },
      checklists: { include: { items: true } },
      comments: true,
      attachments: true,
    },
  })

  // Fire automation rules for task updates.
  await evaluate({
    entity: "task",
    event: "updated",
    record: task as unknown as Record<string, unknown>,
    actorId: currentUserId,
  })

  return serializeTask(task)
}

/** Kanban drag-and-drop: just move the status, stamping completedAt when done. */
export const changeTaskStatus = async (
  id: string,
  input: unknown,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const { status } = taskStatusChangeSchema.parse(input)
  const existing = await prisma.task.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Task not found")
  assertOwnsRecord({ id: currentUserId, role: currentUserRole }, existing.assigneeId)

  const task = await prisma.task.update({
    where: { id },
    data: {
      status: toPrismaStatus(status),
      completedAt:
        status === "done" ? (existing.completedAt ?? new Date()) : null,
    },
  })

  // Fire automation rules for the status change.
  await evaluate({
    entity: "task",
    event: "stage_changed",
    record: task as unknown as Record<string, unknown>,
    actorId: currentUserId,
  })

  return serializeTask(task)
}

export const deleteTask = async (
  id: string,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  const existing = await prisma.task.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound("Task not found")
  assertOwnsRecord({ id: currentUserId, role: currentUserRole }, existing.assigneeId)

  await prisma.task.delete({ where: { id } })
}
