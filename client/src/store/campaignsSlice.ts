import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit"
import { toast } from "sonner"

import type {
  Campaign,
  CampaignMember,
  CampaignResponse,
} from "@/types/crm"
import type { RootState } from "./index"
import {
  addMembers as addMembersRequest,
  createCampaign as createCampaignRequest,
  deleteCampaign as deleteCampaignRequest,
  getCampaign as getCampaignRequest,
  getCampaigns as getCampaignsRequest,
  getMembers as getMembersRequest,
  removeMember as removeMemberRequest,
  setMemberResponse as setMemberResponseRequest,
  updateCampaign as updateCampaignRequest,
  type CampaignsFilters,
} from "@/services/campaignsService"

const campaignsAdapter = createEntityAdapter<Campaign>({
  sortComparer: (a, b) => b.startDate.localeCompare(a.startDate),
})

const membersAdapter = createEntityAdapter<CampaignMember>()

export type CampaignDraft = Omit<Campaign, "id" | "createdAt">

type CampaignsStatus = "idle" | "loading" | "succeeded" | "failed"

interface CampaignsState {
  status: CampaignsStatus
  error: string | null
}

const initialState = {
  campaigns: campaignsAdapter.getInitialState<CampaignsState>({
    status: "idle",
    error: null,
  }),
  members: membersAdapter.getInitialState(),
}

// ---------------------------------------------------------------- thunks

export const fetchCampaigns = createAsyncThunk(
  "campaigns/fetchCampaigns",
  async (filters: CampaignsFilters = {}) => {
    return getCampaignsRequest(filters)
  }
)

export const fetchCampaign = createAsyncThunk(
  "campaigns/fetchCampaign",
  async (id: string) => {
    const { campaign } = await getCampaignRequest(id)
    return campaign
  }
)

export const createCampaign = createAsyncThunk(
  "campaigns/createCampaign",
  async (draft: Partial<Campaign>) => {
    const { campaign } = await createCampaignRequest(draft)
    return campaign
  }
)

export const updateCampaign = createAsyncThunk(
  "campaigns/updateCampaign",
  async ({ id, changes }: { id: string; changes: Partial<Campaign> }) => {
    const { campaign } = await updateCampaignRequest(id, changes)
    return campaign
  }
)

export const deleteCampaign = createAsyncThunk(
  "campaigns/deleteCampaign",
  async (id: string) => {
    await deleteCampaignRequest(id)
    return id
  }
)

export const fetchMembers = createAsyncThunk(
  "campaigns/fetchMembers",
  async (campaignId: string) => {
    const { members } = await getMembersRequest(campaignId)
    return { campaignId, members }
  }
)

export const addCampaignMembers = createAsyncThunk(
  "campaigns/addMembers",
  async ({
    campaignId,
    contactIds,
    leadIds,
  }: {
    campaignId: string
    contactIds: string[]
    leadIds: string[]
  }) => {
    const { members } = await addMembersRequest(campaignId, {
      contactIds,
      leadIds,
    })
    return { campaignId, members }
  }
)

export const changeMemberResponse = createAsyncThunk(
  "campaigns/memberResponse",
  async ({
    campaignId,
    memberId,
    response,
  }: {
    campaignId: string
    memberId: string
    response: CampaignResponse
  }) => {
    const { member } = await setMemberResponseRequest(
      campaignId,
      memberId,
      response
    )
    return member
  }
)

export const removeCampaignMember = createAsyncThunk(
  "campaigns/removeMember",
  async ({ campaignId, memberId }: { campaignId: string; memberId: string }) => {
    await removeMemberRequest(campaignId, memberId)
    return memberId
  }
)

// ---------------------------------------------------------------- slice

const campaignsSlice = createSlice({
  name: "campaigns",
  initialState,
  reducers: {
    /** Local actions kept for compatibility. */
    campaignAdded: (state, action: PayloadAction<Campaign>) => {
      campaignsAdapter.addOne(state.campaigns, action.payload)
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
    membersAdded: (state, action: PayloadAction<CampaignMember[]>) => {
      membersAdapter.addMany(state.members, action.payload)
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
  extraReducers: (builder) => {
    builder
      // fetchCampaigns
      .addCase(fetchCampaigns.pending, (state) => {
        state.campaigns.status = "loading"
        state.campaigns.error = null
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        campaignsAdapter.setAll(state.campaigns, action.payload.campaigns)
        state.campaigns.status = "succeeded"
        state.campaigns.error = null
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.campaigns.status = "failed"
        state.campaigns.error = action.error.message ?? "Failed to load campaigns"
        toast.error("Failed to load campaigns")
      })

      // fetchCampaign
      .addCase(fetchCampaign.fulfilled, (state, action) => {
        campaignsAdapter.upsertOne(state.campaigns, action.payload)
        state.campaigns.status = "succeeded"
      })

      // createCampaign
      .addCase(createCampaign.fulfilled, (state, action) => {
        campaignsAdapter.addOne(state.campaigns, action.payload)
        state.campaigns.status = "succeeded"
        toast.success("Campaign created")
      })
      .addCase(createCampaign.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to create campaign")
      })

      // updateCampaign
      .addCase(updateCampaign.fulfilled, (state, action) => {
        campaignsAdapter.upsertOne(state.campaigns, action.payload)
        state.campaigns.status = "succeeded"
        toast.success("Campaign updated")
      })
      .addCase(updateCampaign.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to update campaign")
      })

      // deleteCampaign
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        campaignsAdapter.removeOne(state.campaigns, action.payload)
        toast.success("Campaign deleted")
      })
      .addCase(deleteCampaign.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to delete campaign")
      })

      // fetchMembers
      .addCase(fetchMembers.fulfilled, (state, action) => {
        const existing = Object.values(state.members.entities).filter(
          (m) => m?.campaignId !== action.payload.campaignId
        )
        membersAdapter.setAll(state.members, [
          ...existing,
          ...action.payload.members,
        ])
      })

      // addCampaignMembers
      .addCase(addCampaignMembers.fulfilled, (state, action) => {
        membersAdapter.addMany(state.members, action.payload.members)
        toast.success("Audience added to campaign")
      })
      .addCase(addCampaignMembers.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to add audience")
      })

      // changeMemberResponse
      .addCase(changeMemberResponse.fulfilled, (state, action) => {
        membersAdapter.upsertOne(state.members, action.payload)
      })
      .addCase(changeMemberResponse.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to update response")
      })

      // removeCampaignMember
      .addCase(removeCampaignMember.fulfilled, (state, action) => {
        membersAdapter.removeOne(state.members, action.payload)
        toast.success("Member removed from campaign")
      })
      .addCase(removeCampaignMember.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to remove member")
      })
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

export const {
  selectAll: selectAllCampaigns,
  selectById: selectCampaignById,
} = campaignsAdapter.getSelectors<RootState>((state) => state.campaigns.campaigns)

export const selectCampaignsStatus = (state: RootState) =>
  state.campaigns.campaigns.status
export const selectCampaignsError = (state: RootState) =>
  state.campaigns.campaigns.error

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
