import {
  createEntityAdapter,
  createSelector,
  createSlice,
  nanoid,
  type PayloadAction,
} from "@reduxjs/toolkit"

import type { CrmDocument } from "@/types/crm"
import type { RootState } from "./index"
import { SEED_DOCUMENTS } from "./seed"

const documentsAdapter = createEntityAdapter<CrmDocument>({
  sortComparer: (a, b) => b.uploadedAt.localeCompare(a.uploadedAt),
})

export type DocumentDraft = Omit<CrmDocument, "id" | "uploadedAt">

const documentsSlice = createSlice({
  name: "documents",
  initialState: documentsAdapter.setAll(
    documentsAdapter.getInitialState(),
    SEED_DOCUMENTS
  ),
  reducers: {
    /**
     * Records document *metadata* only. File bytes are never held here — see
     * `services/documentService.ts` for where storage gets wired in.
     */
    documentAdded: {
      reducer: documentsAdapter.addOne,
      prepare: (draft: DocumentDraft) => ({
        payload: {
          ...draft,
          id: nanoid(),
          uploadedAt: new Date().toISOString(),
        } satisfies CrmDocument,
      }),
    },
    documentUpdated: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<CrmDocument> }>
    ) => {
      documentsAdapter.updateOne(state, action.payload)
    },
    documentRemoved: documentsAdapter.removeOne,
  },
})

export const { documentAdded, documentUpdated, documentRemoved } =
  documentsSlice.actions

export default documentsSlice.reducer

// ---------------------------------------------------------------- selectors

export const { selectAll: selectAllDocuments, selectById: selectDocumentById } =
  documentsAdapter.getSelectors<RootState>((state) => state.documents)

export const selectDocumentsByContactId = createSelector(
  [selectAllDocuments, (_: RootState, contactId: string) => contactId],
  (docs, contactId) => docs.filter((d) => d.contactId === contactId)
)

export const selectDocumentsByCompanyId = createSelector(
  [selectAllDocuments, (_: RootState, companyId: string) => companyId],
  (docs, companyId) => docs.filter((d) => d.companyId === companyId)
)

export const selectDocumentsByLeadId = createSelector(
  [selectAllDocuments, (_: RootState, leadId: string) => leadId],
  (docs, leadId) => docs.filter((d) => d.leadId === leadId)
)
