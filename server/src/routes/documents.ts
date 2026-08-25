import { Router } from "express"
import multer from "multer"

import { ok, created, ApiError } from "@/lib/http"
import { authenticate } from "@/middleware/auth"
import {
  createDocument,
  deleteDocument,
  getDocument,
  getDownloadUrl,
  listDocuments,
  uploadDocument,
} from "@/services/documentsService"

export const documentsRouter = Router()

// In-memory storage: the file buffer is handed straight to S3, never kept on disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB per file
})

documentsRouter.use(authenticate)

documentsRouter.get("/", async (req, res) => {
  const result = await listDocuments(req.query, req.user!.id, req.user!.role)
  ok(res, result, "OK")
})

documentsRouter.post(
  "/",
  upload.single("file"),
  async (req, res) => {
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
)

documentsRouter.post("/metadata", async (req, res) => {
  const doc = await createDocument(req.body, req.user!.id, req.user!.role)
  created(res, { document: doc }, "Document recorded")
})

documentsRouter.get("/:id", async (req, res) => {
  const doc = await getDocument(req.params.id, req.user!.id, req.user!.role)
  ok(res, { document: doc }, "OK")
})

documentsRouter.get("/:id/download", async (req, res) => {
  const url = await getDownloadUrl(req.params.id, req.user!.id, req.user!.role)
  ok(res, { url }, "OK")
})

documentsRouter.delete("/:id", async (req, res) => {
  await deleteDocument(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Document deleted")
})
