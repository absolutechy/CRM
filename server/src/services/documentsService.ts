import { z } from "zod"
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "node:crypto"

import { env, hasStorageConfig } from "@/config/env"
import { prisma } from "@/lib/prisma"
import { ApiError } from "@/lib/http"
import type { UserRole } from "@prisma/client"

// ---------------------------------------------------------------- S3 client

let s3: S3Client | null = null

const getS3 = (): S3Client => {
  if (s3) return s3
  if (!hasStorageConfig) {
    throw ApiError.badRequest(
      "Storage is not configured — add the S3 environment variables"
    )
  }
  s3 = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION ?? "us-east-1",
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    // Supabase's S3 gateway rejects the SDK's default CRC32 checksum headers
    // ("XML parse error"). Only send checksums when the API requires them.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    },
  })
  return s3
}

const storageKeyFor = (id: string, name: string) =>
  `documents/${id}/${name}`

// ---------------------------------------------------------------- validation

export const documentCategorySchema = z.enum([
  "proposal",
  "quote",
  "contract",
  "other",
])

export const documentMetadataSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string().max(120),
  category: documentCategorySchema.default("other"),
  contactId: z.string().cuid().nullable().default(null),
  companyId: z.string().cuid().nullable().default(null),
  leadId: z.string().cuid().nullable().default(null),
  dealId: z.string().cuid().nullable().default(null),
})

/**
 * Multipart upload payload — `name`/`mimeType` are optional because they come
 * from the uploaded file itself; only category + record links are form fields.
 */
export const documentUploadSchema = documentMetadataSchema.omit({
  name: true,
  mimeType: true,
})

export interface DocumentFilters {
  contactId?: string
  companyId?: string
  leadId?: string
  dealId?: string
  category?: string
  search?: string
  page?: number
  pageSize?: number
}

// ---------------------------------------------------------------- helpers

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

const serializeDocument = (doc: any) => ({
  ...doc,
  sizeBytes: doc.sizeBytes ? Number(doc.sizeBytes) : 0,
})

// ---------------------------------------------------------------- service

export const listDocuments = async (
  filters: DocumentFilters,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const {
    contactId,
    companyId,
    leadId,
    dealId,
    category,
    search,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
  } = filters

  const take = Math.min(
    Math.max(Number(pageSize) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  )
  const skip = ((Math.max(Number(page), 1) || DEFAULT_PAGE) - 1) * take

  const where: any = {}
  if (contactId) where.contactId = contactId
  if (companyId) where.companyId = companyId
  if (leadId) where.leadId = leadId
  if (dealId) where.dealId = dealId
  if (category) where.category = category
  if (search?.trim()) {
    where.name = { contains: search.trim(), mode: "insensitive" }
  }

  const [total, documents] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      skip,
      take,
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    }),
  ])

  return {
    documents: documents.map(serializeDocument),
    total,
    page: Math.max(Number(page), 1) || DEFAULT_PAGE,
    pageSize: take,
    totalPages: Math.max(1, Math.ceil(total / take)),
  }
}

export const getDocument = async (
  id: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { uploadedBy: { select: { id: true, name: true } } },
  })
  if (!doc) throw ApiError.notFound("Document not found")
  return serializeDocument(doc)
}

export const createDocument = async (
  input: unknown,
  currentUserId: string,
  _currentUserRole: UserRole
) => {
  const data = documentMetadataSchema.parse(input)

  // Validate the linked record exists.
  if (data.contactId) {
    const contact = await prisma.contact.findUnique({ where: { id: data.contactId } })
    if (!contact) throw ApiError.badRequest("Contact not found")
  }
  if (data.companyId) {
    const company = await prisma.company.findUnique({ where: { id: data.companyId } })
    if (!company) throw ApiError.badRequest("Company not found")
  }
  if (data.leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: data.leadId } })
    if (!lead) throw ApiError.badRequest("Lead not found")
  }
  if (data.dealId) {
    const deal = await prisma.deal.findUnique({ where: { id: data.dealId } })
    if (!deal) throw ApiError.badRequest("Deal not found")
  }

  const doc = await prisma.document.create({
    data: {
      name: data.name,
      mimeType: data.mimeType,
      sizeBytes: 0n,
      category: data.category,
      contactId: data.contactId,
      companyId: data.companyId,
      leadId: data.leadId,
      dealId: data.dealId,
      uploadedById: currentUserId,
      storageKey: null,
    },
    include: { uploadedBy: { select: { id: true, name: true } } },
  })

  return serializeDocument(doc)
}

/**
 * Uploads a file's bytes to S3 and records its metadata row.
 * The file arrives as an Express Multer buffer; we put it directly to S3.
 *
 * Order matters: the object is PUT to S3 first, then the row is created — so a
 * failed upload can never leave an orphan metadata row that looks "uploaded".
 */
export const uploadDocument = async (
  input: unknown,
  file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  currentUserId: string,
  _currentUserRole: UserRole
) => {
  const data = documentUploadSchema.parse(input)
  const name = file.originalname || "Untitled"
  const s3Client = getS3()

  // Reject duplicate file names within the same linked scope.
  const existing = await prisma.document.findFirst({
    where: {
      name,
      contactId: data.contactId,
      companyId: data.companyId,
      leadId: data.leadId,
      dealId: data.dealId,
    },
  })
  if (existing) {
    throw ApiError.conflict(
      `A document named "${name}" is already attached to this record`
    )
  }

  const storageKey = storageKeyFor(randomUUID(), name)

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: storageKey,
      Body: file.buffer,
      ContentType: file.mimetype || "application/octet-stream",
    })
  )

  const doc = await prisma.document.create({
    data: {
      name,
      mimeType: file.mimetype || "application/octet-stream",
      sizeBytes: BigInt(file.size),
      category: data.category,
      contactId: data.contactId,
      companyId: data.companyId,
      leadId: data.leadId,
      dealId: data.dealId,
      uploadedById: currentUserId,
      storageKey,
    },
    include: { uploadedBy: { select: { id: true, name: true } } },
  })

  return serializeDocument(doc)
}

/** Returns a time-limited signed URL for downloading the stored object. */
export const getDownloadUrl = async (
  id: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc) throw ApiError.notFound("Document not found")
  if (!doc.storageKey) throw ApiError.badRequest("This document has no stored file")

  const url = await getSignedUrl(
    getS3(),
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: doc.storageKey }),
    { expiresIn: 3600 }
  )
  return url
}

export const deleteDocument = async (
  id: string,
  _currentUserId: string,
  _currentUserRole: UserRole
) => {
  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc) throw ApiError.notFound("Document not found")

  // Remove the stored object (if any) and the metadata row.
  if (doc.storageKey && hasStorageConfig) {
    await getS3().send(
      new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: doc.storageKey })
    )
  }

  await prisma.document.delete({ where: { id } })
}
