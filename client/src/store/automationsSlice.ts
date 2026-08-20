import {
  createEntityAdapter,
  createSlice,
  nanoid,
  type PayloadAction,
} from "@reduxjs/toolkit"

import type { AutomationRule } from "@/types/crm"
import type { RootState } from "./index"
import { SEED_AUTOMATION_RULES } from "./seed"

const automationsAdapter = createEntityAdapter<AutomationRule>({
  sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
})

export type RuleDraft = Omit<AutomationRule, "id" | "createdAt" | "updatedAt">

const automationsSlice = createSlice({
  name: "automations",
  initialState: automationsAdapter.setAll(
    automationsAdapter.getInitialState(),
    SEED_AUTOMATION_RULES
  ),
  reducers: {
    /**
     * Rules are authored and stored, never executed — evaluation belongs on the
     * backend. See `services/automationService.ts`.
     */
    ruleAdded: {
      reducer: automationsAdapter.addOne,
      prepare: (draft: RuleDraft) => {
        const now = new Date().toISOString()
        return {
          payload: {
            ...draft,
            id: nanoid(),
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
})

export const { ruleAdded, ruleUpdated, ruleToggled, ruleRemoved } =
  automationsSlice.actions

export default automationsSlice.reducer

// ---------------------------------------------------------------- selectors

export const { selectAll: selectAllRules, selectById: selectRuleById } =
  automationsAdapter.getSelectors<RootState>((state) => state.automations)
