import type { Request, Response } from "express"

import { ok, created } from "@/lib/http"
import {
  changeTaskStatus,
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from "@/services/tasksService"

type IdParams = { id: string }

export const index = async (req: Request, res: Response) => {
  const result = await listTasks(req.query, req.user!.id, req.user!.role)
  ok(res, result, "OK")
}

export const create = async (req: Request, res: Response) => {
  const task = await createTask(req.body, req.user!.id, req.user!.role)
  created(res, { task }, "Task created")
}

export const show = async (req: Request<IdParams>, res: Response) => {
  const task = await getTask(req.params.id, req.user!.id, req.user!.role)
  ok(res, { task }, "OK")
}

export const update = async (req: Request<IdParams>, res: Response) => {
  const task = await updateTask(req.params.id, req.body, req.user!.id, req.user!.role)
  ok(res, { task }, "Task updated")
}

export const changeStatus = async (req: Request<IdParams>, res: Response) => {
  const task = await changeTaskStatus(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { task }, "Status updated")
}

export const destroy = async (req: Request<IdParams>, res: Response) => {
  await deleteTask(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Task deleted")
}
