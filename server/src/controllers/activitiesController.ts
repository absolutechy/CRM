import type { Request, Response } from "express"

import { ok, created } from "@/lib/http"
import {
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  updateActivity,
} from "@/services/activitiesService"

type IdParams = { id: string }

export const index = async (req: Request, res: Response) => {
  const result = await listActivities(req.query, req.user!.id, req.user!.role)
  ok(res, result, "OK")
}

export const create = async (req: Request, res: Response) => {
  const activity = await createActivity(req.body, req.user!.id, req.user!.role)
  created(res, { activity }, "Activity logged")
}

export const show = async (req: Request<IdParams>, res: Response) => {
  const activity = await getActivity(req.params.id, req.user!.id, req.user!.role)
  ok(res, { activity }, "OK")
}

export const update = async (req: Request<IdParams>, res: Response) => {
  const activity = await updateActivity(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { activity }, "Activity updated")
}

export const destroy = async (req: Request<IdParams>, res: Response) => {
  await deleteActivity(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Activity deleted")
}
