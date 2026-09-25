import { Router } from "express"

import * as controller from "@/controllers/emailsController"
import { authenticate } from "@/middleware/auth"

export const emailsRouter = Router()

emailsRouter.use(authenticate)

// ---- templates
emailsRouter.get("/templates", controller.indexTemplates)
emailsRouter.post("/templates", controller.createTemplate)
emailsRouter.patch("/templates/:id", controller.updateTemplate)
emailsRouter.delete("/templates/:id", controller.destroyTemplate)

// ---- accounts
emailsRouter.get("/accounts", controller.indexAccounts)
emailsRouter.post("/accounts", controller.createAccount)
emailsRouter.post("/accounts/:id/sync", controller.syncAccount)

// ---- messages
emailsRouter.get("/", controller.index)
emailsRouter.get("/contact/:contactId", controller.indexByContact)

// ---- send + drafts
emailsRouter.post("/send", controller.send)
emailsRouter.post("/drafts", controller.createDraft)
emailsRouter.delete("/drafts/:id", controller.destroyDraft)
