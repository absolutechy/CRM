import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit"
import { toast } from "sonner"

import type { AutomationRule } from "@/types/crm"
import type { RootState } from "./index"
import {
  createRule,
  deleteRule,
  getRule,
  getRules,
  toggleRule,
  updateRule,
  type RuleDraft,
} from "@/services/automationsService"

const automationsAdapter = createEntityAdapter<AutomationRule>({
  sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
})

type AutomationsStatus = "idle" | "loading" | "succeeded" | "failed"

interface AutomationsState {
  status: AutomationsStatus
  error: string | null
}

const initialState = automationsAdapter.getInitialState<AutomationsState>({
  status: "idle",
  error: null,
})

/** Re-exported so the rule builder and detail page can type their drafts. */
export type { RuleDraft } from "@/services/automationsService"

// ---------------------------------------------------------------- thunks

export const fetchRules = createAsyncThunk(
  "automations/fetchRules",
  async () => {
    const { rules } = await getRules()
    return rules
  }
)

export const fetchRule = createAsyncThunk(
  "automations/fetchRule",
  async (id: string) => {
    const { rule } = await getRule(id)
    return rule
  }
)

export const createAutomationRule = createAsyncThunk(
  "automations/createRule",
  async (draft: Partial<AutomationRule>) => {
    const { rule } = await createRule(draft)
    return rule
  }
)

export const updateAutomationRule = createAsyncThunk(
  "automations/updateRule",
  async ({ id, changes }: { id: string; changes: Partial<AutomationRule> }) => {
    const { rule } = await updateRule(id, changes)
    return rule
  }
)

export const toggleAutomationRule = createAsyncThunk(
  "automations/toggleRule",
  async ({ id, enabled }: { id: string; enabled: boolean }) => {
    const { rule } = await toggleRule(id, enabled)
    return rule
  }
)

export const deleteAutomationRule = createAsyncThunk(
  "automations/deleteRule",
  async (id: string) => {
    await deleteRule(id)
    return id
  }
)

// ---------------------------------------------------------------- slice

const automationsSlice = createSlice({
  name: "automations",
  initialState,
  reducers: {
    /** Local actions kept for compatibility and optimistic updates. */
    ruleAdded: {
      reducer: automationsAdapter.addOne,
      prepare: (draft: RuleDraft) => {
        const now = new Date().toISOString()
        return {
          payload: {
            ...draft,
            id: `local-${Date.now()}`,
            createdAt: now,
            updatedAt: now,
          } satisfies AutomationRule,
        }
      },
    },
    ruleUpdated: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<AutomationRule> }>
    ) => {
      automationsAdapter.updateOne(state, {
        id: action.payload.id,
        changes: {
          ...action.payload.changes,
          updatedAt: new Date().toISOString(),
        },
      })
    },
    ruleToggled: (state, action: PayloadAction<string>) => {
      const rule = state.entities[action.payload]
      if (rule) {
        rule.enabled = !rule.enabled
        rule.updatedAt = new Date().toISOString()
      }
    },
    ruleRemoved: automationsAdapter.removeOne,
  },
  extraReducers: (builder) => {
    builder
      // fetchRules
      .addCase(fetchRules.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchRules.fulfilled, (state, action) => {
        automationsAdapter.setAll(state, action.payload)
        state.status = "succeeded"
        state.error = null
      })
      .addCase(fetchRules.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message ?? "Failed to load rules"
        toast.error("Failed to load rules")
      })

      // fetchRule
      .addCase(fetchRule.fulfilled, (state, action) => {
        automationsAdapter.upsertOne(state, action.payload)
      })

      // createAutomationRule
      .addCase(createAutomationRule.fulfilled, (state, action) => {
        automationsAdapter.upsertOne(state, action.payload)
        state.status = "succeeded"
        toast.success("Rule created")
      })
      .addCase(createAutomationRule.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to create rule")
      })

      // updateAutomationRule
      .addCase(updateAutomationRule.fulfilled, (state, action) => {
        automationsAdapter.upsertOne(state, action.payload)
        state.status = "succeeded"
        toast.success("Rule saved")
      })
      .addCase(updateAutomationRule.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to save rule")
      })

      // toggleAutomationRule
      .addCase(toggleAutomationRule.fulfilled, (state, action) => {
        automationsAdapter.upsertOne(state, action.payload)
        toast.success(action.payload.enabled ? "Rule enabled" : "Rule disabled")
      })
      .addCase(toggleAutomationRule.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to toggle rule")
      })

      // deleteAutomationRule
      .addCase(deleteAutomationRule.fulfilled, (state, action) => {
        automationsAdapter.removeOne(state, action.payload)
        toast.success("Rule deleted")
      })
      .addCase(deleteAutomationRule.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to delete rule")
      })
  },
})

export const { ruleAdded, ruleUpdated, ruleToggled, ruleRemoved } =
  automationsSlice.actions

export default automationsSlice.reducer

// ---------------------------------------------------------------- selectors

export const {
  selectAll: selectAllRules,
  selectById: selectRuleById,
} = automationsAdapter.getSelectors<RootState>((state) => state.automations)

export const selectRulesStatus = (state: RootState) => state.automations.status
export const selectRulesError = (state: RootState) => state.automations.error
