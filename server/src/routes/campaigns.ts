import { Router } from "express"

import { ok, created } from "@/lib/http"
import { authenticate } from "@/middleware/auth"
import {
  addMembers,
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  listMembers,
  removeMember,
  setMemberResponse,
  updateCampaign,
} from "@/services/campaignsService"

export const campaignsRouter = Router()

campaignsRouter.use(authenticate)

campaignsRouter.get("/", async (req, res) => {
  const result = await listCampaigns(req.query, req.user!.id, req.user!.role)
  ok(res, result, "OK")
})

campaignsRouter.post("/", async (req, res) => {
  const campaign = await createCampaign(req.body, req.user!.id, req.user!.role)
  created(res, { campaign }, "Campaign created")
})

campaignsRouter.get("/:id", async (req, res) => {
  const campaign = await getCampaign(req.params.id, req.user!.id, req.user!.role)
  ok(res, { campaign }, "OK")
})

campaignsRouter.patch("/:id", async (req, res) => {
  const campaign = await updateCampaign(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { campaign }, "Campaign updated")
})

campaignsRouter.delete("/:id", async (req, res) => {
  await deleteCampaign(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Campaign deleted")
})

// ---- members

campaignsRouter.get("/:id/members", async (req, res) => {
  const members = await listMembers(req.params.id, req.user!.id, req.user!.role)
  ok(res, { members }, "OK")
})

campaignsRouter.post("/:id/members", async (req, res) => {
  const members = await addMembers(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  created(res, { members }, "Members added")
})

campaignsRouter.patch("/:id/members/:memberId", async (req, res) => {
  const member = await setMemberResponse(
    req.params.id,
    req.params.memberId,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { member }, "Response updated")
})

campaignsRouter.delete("/:id/members/:memberId", async (req, res) => {
  await removeMember(
    req.params.id,
    req.params.memberId,
    req.user!.id,
    req.user!.role
  )
  ok(res, null, "Member removed")
})
