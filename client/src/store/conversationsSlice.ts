import {
  createEntityAdapter,
  createSelector,
  createSlice,
  nanoid,
  type PayloadAction,
} from "@reduxjs/toolkit"

import {
  INITIAL_CONVERSATIONS,
  type Conversation,
} from "@/components/pages/messages/data"
import type { RootState } from "./index"

const conversationsAdapter = createEntityAdapter<Conversation>()

const conversationsSlice = createSlice({
  name: "conversations",
  initialState: conversationsAdapter.setAll(
    conversationsAdapter.getInitialState(),
    INITIAL_CONVERSATIONS
  ),
  reducers: {
    messageSent: (
      state,
      action: PayloadAction<{ conversationId: string; body: string }>
    ) => {
      const conversation = state.entities[action.payload.conversationId]
      if (!conversation) return
      conversation.messages.push({
        id: nanoid(),
        author: "me",
        body: action.payload.body,
        at: new Date().toISOString(),
        status: "sent",
      })
    },
    /** Opening a conversation clears its unread count. */
    conversationRead: (state, action: PayloadAction<string>) => {
      const conversation = state.entities[action.payload]
      if (conversation) conversation.unreadCount = 0
    },
  },
})

export const { messageSent, conversationRead } = conversationsSlice.actions

export default conversationsSlice.reducer

// ---------------------------------------------------------------- selectors

export const {
  selectAll: selectAllConversations,
  selectById: selectConversationById,
} = conversationsAdapter.getSelectors<RootState>((state) => state.conversations)

export const selectConversationsByContactId = createSelector(
  [selectAllConversations, (_: RootState, contactId: string) => contactId],
  (conversations, contactId) =>
    conversations.filter((c) => c.contactId === contactId)
)
