import { Router } from "express"

import { ok, created } from "@/lib/http"
import { authenticate } from "@/middleware/auth"
import {
  changeTaskStatus,
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from "@/services/tasksService"

export const tasksRouter = Router()

tasksRouter.use(authenticate)

tasksRouter.get("/", async (req, res) => {
  const result = await listTasks(req.query, req.user!.id, req.user!.role)
  ok(res, result, "OK")
})

tasksRouter.post("/", async (req, res) => {
  const task = await createTask(req.body, req.user!.id, req.user!.role)
  created(res, { task }, "Task created")
})

tasksRouter.get("/:id", async (req, res) => {
  const task = await getTask(req.params.id, req.user!.id, req.user!.role)
  ok(res, { task }, "OK")
})

tasksRouter.patch("/:id", async (req, res) => {
  const task = await updateTask(req.params.id, req.body, req.user!.id, req.user!.role)
  ok(res, { task }, "Task updated")
})

tasksRouter.patch("/:id/status", async (req, res) => {
  const task = await changeTaskStatus(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { task }, "Status updated")
})

tasksRouter.delete("/:id", async (req, res) => {
  await deleteTask(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Task deleted")
})
