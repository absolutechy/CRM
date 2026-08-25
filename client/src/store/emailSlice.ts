import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit"
import { toast } from "sonner"

import type { EmailAccount, EmailMessage, EmailTemplate } from "@/types/crm"
import type { RootState } from "./index"
import {
  createTemplate,
  createAccount,
  deleteDraft,
  deleteTemplate,
  getAccounts,
  getEmails,
  getTemplates,
  saveDraft,
  sendEmail,
  syncAccount,
  updateTemplate,
  type NewAccountInput,
  type SendEmailInput,
} from "@/services/emailService"

const templatesAdapter = createEntityAdapter<EmailTemplate>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
})

const messagesAdapter = createEntityAdapter<EmailMessage>({
  sortComparer: (a, b) => (b.sentAt ?? "").localeCompare(a.sentAt ?? ""),
})

const accountsAdapter = createEntityAdapter<EmailAccount>()

export type TemplateDraft = Omit<EmailTemplate, "id" | "updatedAt">

const initialState = {
  templates: templatesAdapter.getInitialState(),
  messages: messagesAdapter.getInitialState(),
  accounts: accountsAdapter.getInitialState(),
}

// ---------------------------------------------------------------- thunks

export const fetchEmailTemplates = createAsyncThunk(
  "email/fetchTemplates",
  async () => {
    const { templates } = await getTemplates()
    return templates
  }
)

export const createEmailTemplate = createAsyncThunk(
  "email/createTemplate",
  async (draft: TemplateDraft) => {
    const { template } = await createTemplate(draft)
    return template
  }
)

export const updateEmailTemplate = createAsyncThunk(
  "email/updateTemplate",
  async ({ id, changes }: { id: string; changes: Partial<EmailTemplate> }) => {
    const { template } = await updateTemplate(id, changes)
    return template
  }
)

export const removeEmailTemplate = createAsyncThunk(
  "email/deleteTemplate",
  async (id: string) => {
    await deleteTemplate(id)
    return id
  }
)

export const fetchEmails = createAsyncThunk("email/fetchEmails", async () => {
  const { emails } = await getEmails()
  return emails
})

export const fetchEmailAccounts = createAsyncThunk(
  "email/fetchAccounts",
  async () => {
    const { accounts } = await getAccounts()
    return accounts
  }
)

export const syncEmailAccount = createAsyncThunk(
  "email/syncAccount",
  async (accountId: string) => {
    const { account } = await syncAccount(accountId)
    return account
  }
)

export const addEmailAccount = createAsyncThunk(
  "email/addAccount",
  async (input: NewAccountInput) => {
    const { account } = await createAccount(input)
    return account
  }
)

export const sendEmailThunk = createAsyncThunk(
  "email/send",
  async (input: SendEmailInput) => {
    const result = await sendEmail(input)
    return result
  }
)

export const saveEmailDraft = createAsyncThunk(
  "email/saveDraft",
  async (input: SendEmailInput) => {
    const { draft } = await saveDraft(input)
    return draft
  }
)

export const removeEmailDraft = createAsyncThunk(
  "email/deleteDraft",
  async (id: string) => {
    await deleteDraft(id)
    return id
  }
)

// ---------------------------------------------------------------- slice

const emailSlice = createSlice({
  name: "email",
  initialState,
  reducers: {
    /** Local actions kept for compatibility (drafts). */
    draftSaved: {
      reducer: (state, action: PayloadAction<EmailMessage>) => {
        messagesAdapter.addOne(state.messages, action.payload)
      },
      prepare: (draft: Omit<EmailMessage, "id" | "status">) => ({
        payload: { ...draft, id: `draft-${Date.now()}`, status: "draft" } satisfies EmailMessage,
      }),
    },
    draftRemoved: (state, action: PayloadAction<string>) => {
      messagesAdapter.removeOne(state.messages, action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // templates
      .addCase(fetchEmailTemplates.fulfilled, (state, action) => {
        templatesAdapter.setAll(state.templates, action.payload)
      })
      .addCase(createEmailTemplate.fulfilled, (state, action) => {
        templatesAdapter.addOne(state.templates, action.payload)
        toast.success("Template created")
      })
      .addCase(createEmailTemplate.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to create template")
      })
      .addCase(updateEmailTemplate.fulfilled, (state, action) => {
        templatesAdapter.upsertOne(state.templates, action.payload)
        toast.success("Template updated")
      })
      .addCase(updateEmailTemplate.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to update template")
      })
      .addCase(removeEmailTemplate.fulfilled, (state, action) => {
        templatesAdapter.removeOne(state.templates, action.payload)
        toast.success("Template deleted")
      })
      .addCase(removeEmailTemplate.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to delete template")
      })

      // messages
      .addCase(fetchEmails.fulfilled, (state, action) => {
        messagesAdapter.setAll(state.messages, action.payload)
      })

      // accounts
      .addCase(fetchEmailAccounts.fulfilled, (state, action) => {
        accountsAdapter.setAll(state.accounts, action.payload)
      })
      .addCase(syncEmailAccount.fulfilled, (state, action) => {
        accountsAdapter.upsertOne(state.accounts, action.payload)
        toast.success("Mailbox synced")
      })
      .addCase(syncEmailAccount.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to sync account")
      })
      .addCase(addEmailAccount.fulfilled, (state, action) => {
        accountsAdapter.upsertOne(state.accounts, action.payload)
        toast.success("Email account added")
      })
      .addCase(addEmailAccount.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to add account")
      })

      // send
      .addCase(sendEmailThunk.fulfilled, (state, action) => {
        messagesAdapter.addOne(state.messages, action.payload.email)
        if (action.payload.sent) {
          toast.success("Email sent")
        } else {
          toast.warning(action.payload.message)
        }
      })
      .addCase(sendEmailThunk.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to send email")
      })

      // drafts
      .addCase(saveEmailDraft.fulfilled, (state, action) => {
        messagesAdapter.upsertOne(state.messages, action.payload)
        toast.success("Draft saved")
      })
      .addCase(saveEmailDraft.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to save draft")
      })
      .addCase(removeEmailDraft.fulfilled, (state, action) => {
        messagesAdapter.removeOne(state.messages, action.payload)
        toast.success("Draft deleted")
      })
      .addCase(removeEmailDraft.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to delete draft")
      })
  },
})

export const { draftSaved, draftRemoved } = emailSlice.actions

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
