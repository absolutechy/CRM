import { Router } from "express"

import { activitiesRouter } from "./activities"
import { authRouter } from "./auth"
import { automationsRouter } from "./automations"
import { campaignsRouter } from "./campaigns"
import { companiesRouter } from "./companies"
import { contactsRouter } from "./contacts"
import { dealsRouter } from "./deals"
import { documentsRouter } from "./documents"
import { emailTemplatesRouter } from "./emailTemplates"
import { emailsRouter } from "./emails"
import { healthRouter } from "./health"
import { leadsRouter } from "./leads"
import { notificationsRouter } from "./notifications"
import { tasksRouter } from "./tasks"
import { usersRouter } from "./users"

/**
 * The whole API surface, mounted under /api by app.ts. Adding a resource means
 * touching this file and nothing else.
 */
export const apiRouter: Router = Router()

apiRouter.use("/health", healthRouter)
apiRouter.use("/auth", authRouter)
apiRouter.use("/leads", leadsRouter)
apiRouter.use("/contacts", contactsRouter)
apiRouter.use("/companies", companiesRouter)
apiRouter.use("/deals", dealsRouter)
apiRouter.use("/activities", activitiesRouter)
apiRouter.use("/tasks", tasksRouter)
apiRouter.use("/documents", documentsRouter)
apiRouter.use("/users", usersRouter)
apiRouter.use("/campaigns", campaignsRouter)
apiRouter.use("/email-templates", emailTemplatesRouter)
apiRouter.use("/emails", emailsRouter)
apiRouter.use("/automations", automationsRouter)
apiRouter.use("/notifications", notificationsRouter)
