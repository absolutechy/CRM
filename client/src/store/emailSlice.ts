import {
  createEntityAdapter,
  createSelector,
  createSlice,
  nanoid,
  type PayloadAction,
} from "@reduxjs/toolkit"

import type { EmailAccount, EmailMessage, EmailTemplate } from "@/types/crm"
import type { RootState } from "./index"
import {
  SEED_EMAIL_ACCOUNTS,
  SEED_EMAIL_MESSAGES,
  SEED_EMAIL_TEMPLATES,
} from "./seed"

const templatesAdapter = createEntityAdapter<EmailTemplate>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
})

const messagesAdapter = createEntityAdapter<EmailMessage>({
  sortComparer: (a, b) => (b.sentAt ?? "").localeCompare(a.sentAt ?? ""),
})

const accountsAdapter = createEntityAdapter<EmailAccount>()

export type TemplateDraft = Omit<EmailTemplate, "id" | "updatedAt">

const initialState = {
  templates: templatesAdapter.setAll(
    templatesAdapter.getInitialState(),
    SEED_EMAIL_TEMPLATES
  ),
  messages: messagesAdapter.setAll(
    messagesAdapter.getInitialState(),
    SEED_EMAIL_MESSAGES
  ),
  accounts: accountsAdapter.setAll(
    accountsAdapter.getInitialState(),
    SEED_EMAIL_ACCOUNTS
  ),
}

const emailSlice = createSlice({
  name: "email",
  initialState,
  reducers: {
    templateAdded: {
      reducer: (state, action: PayloadAction<EmailTemplate>) => {
        templatesAdapter.addOne(state.templates, action.payload)
      },
      prepare: (draft: TemplateDraft) => ({
        payload: {
          ...draft,
          id: nanoid(),
          updatedAt: new Date().toISOString(),
        } satisfies EmailTemplate,
      }),
    },
    templateUpdated: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<EmailTemplate> }>
    ) => {
      templatesAdapter.updateOne(state.templates, {
        id: action.payload.id,
        changes: {
          ...action.payload.changes,
          updatedAt: new Date().toISOString(),
        },
      })
    },
    templateRemoved: (state, action: PayloadAction<string>) => {
      templatesAdapter.removeOne(state.templates, action.payload)
    },
    /**
     * Only used for drafts today. Sending is backend work — see
     * `services/emailService.ts`; nothing here fabricates a "sent" message.
     */
    draftSaved: {
      reducer: (state, action: PayloadAction<EmailMessage>) => {
        messagesAdapter.addOne(state.messages, action.payload)
      },
      prepare: (draft: Omit<EmailMessage, "id" | "status">) => ({
        payload: { ...draft, id: nanoid(), status: "draft" } satisfies EmailMessage,
      }),
    },
    draftRemoved: (state, action: PayloadAction<string>) => {
      messagesAdapter.removeOne(state.messages, action.payload)
    },
  },
})

export const {
  templateAdded,
  templateUpdated,
  templateRemoved,
  draftSaved,
  draftRemoved,
} = emailSlice.actions

export default emailSlice.reducer

// ---------------------------------------------------------------- selectors

export const {
  selectAll: selectAllTemplates,
  selectById: selectTemplateById,
  selectEntities: selectTemplateEntities,
} = templatesAdapter.getSelectors<RootState>((state) => state.email.templates)

export const { selectAll: selectAllEmails, selectById: selectEmailById } =
  messagesAdapter.getSelectors<RootState>((state) => state.email.messages)

export const { selectAll: selectAllEmailAccounts } =
  accountsAdapter.getSelectors<RootState>((state) => state.email.accounts)

export const selectEmailsByContactId = createSelector(
  [selectAllEmails, (_: RootState, contactId: string) => contactId],
  (emails, contactId) => emails.filter((e) => e.contactId === contactId)
)

export const selectEmailsByLeadId = createSelector(
  [selectAllEmails, (_: RootState, leadId: string) => leadId],
  (emails, leadId) => emails.filter((e) => e.leadId === leadId)
)

/** Headline counters for the email dashboard. */
export const selectEmailStats = createSelector([selectAllEmails], (emails) => {
  const sent = emails.filter((e) => e.status === "sent")
  return {
    sent: sent.length,
    drafts: emails.filter((e) => e.status === "draft").length,
    opened: sent.filter((e) => e.openedAt).length,
    clicked: sent.filter((e) => e.clickedAt).length,
  }
})
