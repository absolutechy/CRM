import { useCallback, useState } from "react"

import {
  ContactPanel,
  ConversationList,
  MessageThread,
} from "@/components/pages/messages"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  conversationRead,
  messageSent,
  selectAllConversations,
} from "@/store/conversationsSlice"

const Messages = () => {
  const dispatch = useAppDispatch()
  const conversations = useAppSelector(selectAllConversations)

  const [selectedId, setSelectedId] = useState(conversations[0]?.id ?? "")
  // Single-pane on small screens: the list and the thread swap places.
  const [threadOpenOnMobile, setThreadOpenOnMobile] = useState(false)

  const selected =
    conversations.find((c) => c.id === selectedId) ?? conversations[0]

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id)
      setThreadOpenOnMobile(true)
      dispatch(conversationRead(id))
    },
    [dispatch]
  )

  const handleSend = useCallback(
    (body: string) => {
      if (!selected) return
      dispatch(messageSent({ conversationId: selected.id, body }))
    },
    [dispatch, selected]
  )

  if (!selected) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No conversations yet.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0">
      <ConversationList
        conversations={conversations}
        selectedId={selected.id}
        onSelect={handleSelect}
        className={cn(threadOpenOnMobile && "hidden md:flex")}
      />
      <MessageThread
        conversation={selected}
        onSend={handleSend}
        onBack={() => setThreadOpenOnMobile(false)}
        className={cn(!threadOpenOnMobile && "hidden md:flex")}
      />
      <ContactPanel conversation={selected} />
    </div>
  )
}

export default Messages
