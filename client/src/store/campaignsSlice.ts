import {
  createEntityAdapter,
  createSelector,
  createSlice,
  nanoid,
  type PayloadAction,
} from "@reduxjs/toolkit"

import type { Campaign, CampaignMember, CampaignResponse } from "@/types/crm"
import type { RootState } from "./index"
import { SEED_CAMPAIGNS, SEED_CAMPAIGN_MEMBERS } from "./seed"

const campaignsAdapter = createEntityAdapter<Campaign>({
  sortComparer: (a, b) => b.startDate.localeCompare(a.startDate),
})

const membersAdapter = createEntityAdapter<CampaignMember>()

export type CampaignDraft = Omit<Campaign, "id" | "createdAt">

const initialState = {
  campaigns: campaignsAdapter.setAll(
    campaignsAdapter.getInitialState(),
    SEED_CAMPAIGNS
  ),
  members: membersAdapter.setAll(
    membersAdapter.getInitialState(),
    SEED_CAMPAIGN_MEMBERS
  ),
}

const campaignsSlice = createSlice({
  name: "campaigns",
  initialState,
  reducers: {
    campaignAdded: {
      reducer: (state, action: PayloadAction<Campaign>) => {
        campaignsAdapter.addOne(state.campaigns, action.payload)
      },
      prepare: (draft: CampaignDraft) => ({
        payload: {
          ...draft,
          id: nanoid(),
          createdAt: new Date().toISOString(),
        } satisfies Campaign,
      }),
    },
    campaignUpdated: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Campaign> }>
    ) => {
      campaignsAdapter.updateOne(state.campaigns, action.payload)
    },
    campaignRemoved: (state, action: PayloadAction<string>) => {
      campaignsAdapter.removeOne(state.campaigns, action.payload)
      // Drop orphaned membership rows.
      const orphans = Object.values(state.members.entities)
        .filter((m) => m?.campaignId === action.payload)
        .map((m) => m!.id)
      membersAdapter.removeMany(state.members, orphans)
    },
    membersAdded: {
      reducer: (state, action: PayloadAction<CampaignMember[]>) => {
        membersAdapter.addMany(state.members, action.payload)
      },
      prepare: (input: {
        campaignId: string
        contactIds?: string[]
        leadIds?: string[]
      }) => {
        const addedAt = new Date().toISOString()
        const payload: CampaignMember[] = [
          ...(input.contactIds ?? []).map((contactId) => ({
            id: nanoid(),
            campaignId: input.campaignId,
            contactId,
            leadId: null,
            response: "none" as CampaignResponse,
            addedAt,
          })),
          ...(input.leadIds ?? []).map((leadId) => ({
            id: nanoid(),
            campaignId: input.campaignId,
            contactId: null,
            leadId,
            response: "none" as CampaignResponse,
            addedAt,
          })),
        ]
        return { payload }
      },
    },
    memberRemoved: (state, action: PayloadAction<string>) => {
      membersAdapter.removeOne(state.members, action.payload)
    },
    memberResponseSet: (
      state,
      action: PayloadAction<{ id: string; response: CampaignResponse }>
    ) => {
      membersAdapter.updateOne(state.members, {
        id: action.payload.id,
        changes: { response: action.payload.response },
      })
    },
  },
})

export const {
  campaignAdded,
  campaignUpdated,
  campaignRemoved,
  membersAdded,
  memberRemoved,
  memberResponseSet,
} = campaignsSlice.actions

export default campaignsSlice.reducer

// ---------------------------------------------------------------- selectors

export const { selectAll: selectAllCampaigns, selectById: selectCampaignById } =
  campaignsAdapter.getSelectors<RootState>((state) => state.campaigns.campaigns)

export const { selectAll: selectAllCampaignMembers } =
  membersAdapter.getSelectors<RootState>((state) => state.campaigns.members)

export const selectMembersByCampaignId = createSelector(
  [selectAllCampaignMembers, (_: RootState, campaignId: string) => campaignId],
  (members, campaignId) => members.filter((m) => m.campaignId === campaignId)
)

export const selectMemberCounts = createSelector(
  [selectAllCampaignMembers],
  (members) => {
    const counts: Record<string, number> = {}
    for (const m of members) counts[m.campaignId] = (counts[m.campaignId] ?? 0) + 1
    return counts
  }
)

/** Response funnel for the campaign performance tab. */
export const selectCampaignPerformance = createSelector(
  [selectMembersByCampaignId],
  (members) => {
    const total = members.length
    const by = (r: CampaignResponse) =>
      members.filter((m) => m.response === r).length
    const opened = by("opened") + by("clicked") + by("replied") + by("converted")
    const clicked = by("clicked") + by("replied") + by("converted")
    const replied = by("replied") + by("converted")
    const converted = by("converted")
    return {
      total,
      opened,
      clicked,
      replied,
      converted,
      openRate: total ? Math.round((opened / total) * 100) : 0,
      conversionRate: total ? Math.round((converted / total) * 100) : 0,
    }
  }
)
