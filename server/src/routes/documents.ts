import { Router } from "express"
import multer from "multer"

import * as controller from "@/controllers/documentsController"
import { authenticate } from "@/middleware/auth"

export const documentsRouter = Router()

// In-memory storage: the file buffer is handed straight to S3, never kept on disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB per file
})

documentsRouter.use(authenticate)

documentsRouter.get("/", controller.index)
documentsRouter.post("/", upload.single("file"), controller.upload)
documentsRouter.post("/metadata", controller.create)
documentsRouter.get("/:id", controller.show)
documentsRouter.get("/:id/download", controller.download)
documentsRouter.delete("/:id", controller.destroy)
