import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit"
import { toast } from "sonner"

import type { Contact } from "@/types/crm"
import type { RootState } from "./index"
import {
  createContact as createContactRequest,
  deleteContact as deleteContactRequest,
  getContact as getContactRequest,
  getContacts as getContactsRequest,
  updateContact as updateContactRequest,
  type ContactsFilters,
} from "@/services/contactsService"

const contactsAdapter = createEntityAdapter<Contact>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
})

export type ContactDraft = Omit<Contact, "id" | "createdAt" | "updatedAt">

type ContactsStatus = "idle" | "loading" | "succeeded" | "failed"

interface ContactsState {
  status: ContactsStatus
  error: string | null
}

const initialState = contactsAdapter.getInitialState<ContactsState>({
  status: "idle",
  error: null,
})

// ---------------------------------------------------------------- thunks

export const fetchContacts = createAsyncThunk(
  "contacts/fetchContacts",
  async (filters: ContactsFilters | undefined = {}) => {
    return getContactsRequest(filters ?? {})
  }
)

export const fetchContact = createAsyncThunk(
  "contacts/fetchContact",
  async (id: string) => {
    const { contact } = await getContactRequest(id)
    return contact
  }
)

export const createContact = createAsyncThunk(
  "contacts/createContact",
  async (draft: Partial<Contact>) => {
    const { contact } = await createContactRequest(draft)
    return contact
  }
)

export const updateContact = createAsyncThunk(
  "contacts/updateContact",
  async ({ id, changes }: { id: string; changes: Partial<Contact> }) => {
    const { contact } = await updateContactRequest(id, changes)
    return contact
  }
)

export const deleteContact = createAsyncThunk(
  "contacts/deleteContact",
  async (id: string) => {
    await deleteContactRequest(id)
    return id
  }
)

// ---------------------------------------------------------------- slice

const contactsSlice = createSlice({
  name: "contacts",
  initialState,
  reducers: {
    /** Local actions kept for compatibility and optimistic updates. */
    contactAdded: contactsAdapter.addOne,
    contactUpdated: contactsAdapter.updateOne,
    contactRemoved: contactsAdapter.removeOne,
  },
  extraReducers: (builder) => {
    builder
      // fetchContacts
      .addCase(fetchContacts.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        contactsAdapter.setAll(state, action.payload.contacts)
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.status = "failed"
        state.error =
          typeof action.error.message === "string"
            ? action.error.message
            : "Failed to load contacts"
        toast.error("Failed to load contacts")
      })

      // fetchContact
      .addCase(fetchContact.fulfilled, (state, action) => {
        contactsAdapter.upsertOne(state, action.payload)
      })

      // createContact
      .addCase(createContact.fulfilled, (state, action) => {
        contactsAdapter.addOne(state, action.payload)
        state.status = "succeeded"
        toast.success(`${action.payload.name} added as a contact`)
      })
      .addCase(createContact.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to create contact")
      })

      // updateContact
      .addCase(updateContact.fulfilled, (state, action) => {
        contactsAdapter.upsertOne(state, action.payload)
        state.status = "succeeded"
        toast.success(`${action.payload.name} updated`)
      })
      .addCase(updateContact.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to update contact")
      })

      // deleteContact
      .addCase(deleteContact.fulfilled, (state, action) => {
        contactsAdapter.removeOne(state, action.payload)
        toast.success("Contact deleted")
      })
      .addCase(deleteContact.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to delete contact")
      })
  },
})

export const { contactAdded, contactUpdated, contactRemoved } =
  contactsSlice.actions

export default contactsSlice.reducer

// ---------------------------------------------------------------- selectors

export const {
  selectAll: selectAllContacts,
  selectById: selectContactById,
  selectEntities: selectContactEntities,
  selectTotal: selectContactCount,
} = contactsAdapter.getSelectors<RootState>((state) => state.contacts)

export const selectContactsStatus = (state: RootState) => state.contacts.status
export const selectContactsError = (state: RootState) => state.contacts.error

export const selectContactsByCompanyId = createSelector(
  [selectAllContacts, (_: RootState, companyId: string) => companyId],
  (contacts, companyId) => contacts.filter((c) => c.companyId === companyId)
)

const normalizeEmail = (email: string) => email.trim().toLowerCase()

/**
 * Duplicate guard for the contact form. Returns the existing contact that
 * already owns this email, ignoring the record currently being edited.
 */
export const selectContactByEmail = createSelector(
  [
    selectAllContacts,
    (_: RootState, email: string) => normalizeEmail(email),
    (_: RootState, __: string, excludeId?: string) => excludeId,
  ],
  (contacts, email, excludeId) =>
    email
      ? contacts.find(
          (c) => normalizeEmail(c.email) === email && c.id !== excludeId
        )
      : undefined
)

/**
 * Contacts sharing an email or a name+company pair — surfaced as a banner so
 * fragmented records can be spotted and merged.
 */
export const selectPotentialDuplicates = createSelector(
  [selectAllContacts, (_: RootState, contactId: string) => contactId],
  (contacts, contactId) => {
    const target = contacts.find((c) => c.id === contactId)
    if (!target) return []
    return contacts.filter(
      (c) =>
        c.id !== target.id &&
        (normalizeEmail(c.email) === normalizeEmail(target.email) ||
          (c.name.toLowerCase() === target.name.toLowerCase() &&
            c.companyId === target.companyId))
    )
  }
)
