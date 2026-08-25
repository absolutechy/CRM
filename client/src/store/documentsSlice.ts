import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit"
import { toast } from "sonner"

import type { CrmDocument } from "@/types/crm"
import type { RootState } from "./index"
import { apiRequest } from "@/services/api"
import {
  deleteStoredFile,
  uploadDocument,
  type UploadInput,
} from "@/services/documentService"

const documentsAdapter = createEntityAdapter<CrmDocument>({
  sortComparer: (a, b) => b.uploadedAt.localeCompare(a.uploadedAt),
})

export type DocumentDraft = Omit<CrmDocument, "id" | "uploadedAt">

type DocumentsStatus = "idle" | "loading" | "succeeded" | "failed"

interface DocumentsState {
  status: DocumentsStatus
  error: string | null
}

const initialState = documentsAdapter.getInitialState<DocumentsState>({
  status: "idle",
  error: null,
})

// ---------------------------------------------------------------- thunks

interface PaginatedDocuments {
  documents: CrmDocument[]
}

export const fetchDocuments = createAsyncThunk(
  "documents/fetch",
  async () => {
    const result = await apiRequest<PaginatedDocuments>("/documents")
    return result.documents
  }
)

export const uploadDocumentThunk = createAsyncThunk(
  "documents/upload",
  async (input: UploadInput) => {
    const res = await uploadDocument(input)
    if (!res.ok || !res.data) {
      throw new Error(res.message)
    }
    return res.data
  }
)

export const deleteDocument = createAsyncThunk(
  "documents/delete",
  async (id: string) => {
    const res = await deleteStoredFile(id)
    if (!res.ok) {
      throw new Error(res.message)
    }
    return id
  }
)

// ---------------------------------------------------------------- slice

const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    /** Local actions kept for compatibility. */
    documentAdded: documentsAdapter.addOne,
    documentUpdated: documentsAdapter.updateOne,
    documentRemoved: documentsAdapter.removeOne,
  },
  extraReducers: (builder) => {
    builder
      // fetchDocuments
      .addCase(fetchDocuments.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        documentsAdapter.setAll(state, action.payload)
        state.status = "succeeded"
        state.error = null
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message ?? "Failed to load documents"
        toast.error("Failed to load documents")
      })

      // uploadDocumentThunk
      .addCase(uploadDocumentThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(uploadDocumentThunk.fulfilled, (state, action) => {
        documentsAdapter.addOne(state, action.payload)
        state.status = "succeeded"
        state.error = null
        toast.success("Document uploaded")
      })
      .addCase(uploadDocumentThunk.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message ?? "Failed to upload document"
        toast.error(action.error.message ?? "Failed to upload document")
      })

      // deleteDocument
      .addCase(deleteDocument.fulfilled, (state, action) => {
        documentsAdapter.removeOne(state, action.payload)
        toast.success("Document removed")
      })
      .addCase(deleteDocument.rejected, (_state, action) => {
        toast.error(action.error.message ?? "Failed to remove document")
      })
  },
})

export const { documentAdded, documentUpdated, documentRemoved } =
  documentsSlice.actions

export default documentsSlice.reducer

// ---------------------------------------------------------------- selectors

export const {
  selectAll: selectAllDocuments,
  selectById: selectDocumentById,
} = documentsAdapter.getSelectors<RootState>((state) => state.documents)

export const selectDocumentsStatus = (state: RootState) => state.documents.status
export const selectDocumentsError = (state: RootState) => state.documents.error

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
