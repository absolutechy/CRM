import type { Request, Response } from "express"

import { ok, created, ApiError } from "@/lib/http"
import {
  createDocument,
  deleteDocument,
  getDocument,
  getDownloadUrl,
  listDocuments,
  uploadDocument,
} from "@/services/documentsService"

type IdParams = { id: string }

export const index = async (req: Request, res: Response) => {
  const result = await listDocuments(req.query, req.user!.id, req.user!.role)
  ok(res, result, "OK")
}

/** Multipart upload. `upload.single("file")` runs as route middleware. */
export const upload = async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("No file uploaded")
  }
  const doc = await uploadDocument(
    req.body,
    req.file,
    req.user!.id,
    req.user!.role
  )
  created(res, { document: doc }, "Document uploaded")
}

/** Records a document that already lives in storage. */
export const create = async (req: Request, res: Response) => {
  const doc = await createDocument(req.body, req.user!.id, req.user!.role)
  created(res, { document: doc }, "Document recorded")
}

export const show = async (req: Request<IdParams>, res: Response) => {
  const doc = await getDocument(req.params.id, req.user!.id, req.user!.role)
  ok(res, { document: doc }, "OK")
}

export const download = async (req: Request<IdParams>, res: Response) => {
  const url = await getDownloadUrl(req.params.id, req.user!.id, req.user!.role)
  ok(res, { url }, "OK")
}

export const destroy = async (req: Request<IdParams>, res: Response) => {
  await deleteDocument(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Document deleted")
}
