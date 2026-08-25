import { Router } from "express"

import { ok, created } from "@/lib/http"
import { authenticate } from "@/middleware/auth"
import {
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  updateActivity,
} from "@/services/activitiesService"

export const activitiesRouter = Router()

activitiesRouter.use(authenticate)

activitiesRouter.get("/", async (req, res) => {
  const result = await listActivities(req.query, req.user!.id, req.user!.role)
  ok(res, result, "OK")
})

activitiesRouter.post("/", async (req, res) => {
  const activity = await createActivity(req.body, req.user!.id, req.user!.role)
  created(res, { activity }, "Activity logged")
})

activitiesRouter.get("/:id", async (req, res) => {
  const activity = await getActivity(req.params.id, req.user!.id, req.user!.role)
  ok(res, { activity }, "OK")
})

activitiesRouter.patch("/:id", async (req, res) => {
  const activity = await updateActivity(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { activity }, "Activity updated")
})

activitiesRouter.delete("/:id", async (req, res) => {
  await deleteActivity(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Activity deleted")
})
