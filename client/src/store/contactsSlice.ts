import {
  createEntityAdapter,
  createSelector,
  createSlice,
  nanoid,
  type PayloadAction,
} from "@reduxjs/toolkit"

import type { Contact } from "@/types/crm"
import { EMPTY_ADDRESS, EMPTY_SOCIAL } from "@/types/crm"
import type { RootState } from "./index"
import { SEED_CONTACTS } from "./seed"

const contactsAdapter = createEntityAdapter<Contact>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
})

export type ContactDraft = Omit<Contact, "id" | "createdAt" | "updatedAt">

const contactsSlice = createSlice({
  name: "contacts",
  initialState: contactsAdapter.setAll(
    contactsAdapter.getInitialState(),
    SEED_CONTACTS
  ),
  reducers: {
    contactAdded: {
      reducer: contactsAdapter.addOne,
      // `id` may be supplied so callers (e.g. lead conversion) can reference the
      // new record immediately without reading it back out of the store.
      prepare: (draft: ContactDraft & { id?: string }) => {
        const now = new Date().toISOString()
        return {
          payload: {
            ...draft,
            address: draft.address ?? EMPTY_ADDRESS,
            social: draft.social ?? EMPTY_SOCIAL,
            id: draft.id ?? nanoid(),
            createdAt: now,
            updatedAt: now,
          } satisfies Contact,
        }
      },
    },
    contactUpdated: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Contact> }>
    ) => {
      contactsAdapter.updateOne(state, {
        id: action.payload.id,
        changes: {
          ...action.payload.changes,
          updatedAt: new Date().toISOString(),
        },
      })
    },
    contactRemoved: contactsAdapter.removeOne,
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
