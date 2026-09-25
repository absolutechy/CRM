import type { Request, Response } from "express"

import { ok, created } from "@/lib/http"
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

type IdParams = { id: string }
type MemberParams = { id: string; memberId: string }

export const index = async (req: Request, res: Response) => {
  const result = await listCampaigns(req.query, req.user!.id, req.user!.role)
  ok(res, result, "OK")
}

export const create = async (req: Request, res: Response) => {
  const campaign = await createCampaign(req.body, req.user!.id, req.user!.role)
  created(res, { campaign }, "Campaign created")
}

export const show = async (req: Request<IdParams>, res: Response) => {
  const campaign = await getCampaign(req.params.id, req.user!.id, req.user!.role)
  ok(res, { campaign }, "OK")
}

export const update = async (req: Request<IdParams>, res: Response) => {
  const campaign = await updateCampaign(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { campaign }, "Campaign updated")
}

export const destroy = async (req: Request<IdParams>, res: Response) => {
  await deleteCampaign(req.params.id, req.user!.id, req.user!.role)
  ok(res, null, "Campaign deleted")
}

// ---- members

export const indexMembers = async (req: Request<IdParams>, res: Response) => {
  const members = await listMembers(req.params.id, req.user!.id, req.user!.role)
  ok(res, { members }, "OK")
}

export const createMembers = async (req: Request<IdParams>, res: Response) => {
  const members = await addMembers(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role
  )
  created(res, { members }, "Members added")
}

export const updateMember = async (req: Request<MemberParams>, res: Response) => {
  const member = await setMemberResponse(
    req.params.id,
    req.params.memberId,
    req.body,
    req.user!.id,
    req.user!.role
  )
  ok(res, { member }, "Response updated")
}

export const destroyMember = async (req: Request<MemberParams>, res: Response) => {
  await removeMember(
    req.params.id,
    req.params.memberId,
    req.user!.id,
    req.user!.role
  )
  ok(res, null, "Member removed")
}
