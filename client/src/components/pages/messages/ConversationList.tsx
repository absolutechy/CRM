import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getInitials } from "@/lib/crm"
import { cn } from "@/lib/utils"
import { useAppSelector } from "@/store/hooks"
import { selectCompanyEntities } from "@/store/companiesSlice"
import { selectContactEntities } from "@/store/contactsSlice"

import type { Conversation } from "./data"
import { CHANNEL_META, formatListTimestamp, lastMessageOf } from "./utils"

type Filter = "all" | "unread"

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string
  onSelect: (id: string) => void
  className?: string
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  className,
}) => {
  const contacts = useAppSelector(selectContactEntities)
  const companies = useAppSelector(selectCompanyEntities)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations]
  )

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim()
    return conversations.filter((c) => {
      if (filter === "unread" && c.unreadCount === 0) return false
      if (!q) return true
      const contact = contacts[c.contactId]
      const companyName = contact?.companyId
        ? (companies[contact.companyId]?.name ?? "")
        : ""
      return (
        (contact?.name ?? "").toLowerCase().includes(q) ||
        companyName.toLowerCase().includes(q) ||
        lastMessageOf(c).body.toLowerCase().includes(q)
      )
    })
  }, [conversations, query, filter, contacts, companies])

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col border-r border-border bg-surface md:w-80 md:shrink-0",
        className
      )}
    >
      {/* Pane header */}
      <div className="space-y-3 border-b border-border p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Messages</h2>
          {totalUnread > 0 && (
            <Badge className="h-5 min-w-5 justify-center px-1.5">
              {totalUnread}
            </Badge>
          )}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            className="h-9 pl-8"
            aria-label="Search messages"
          />
        </div>

        <div
          role="tablist"
          aria-label="Filter conversations"
          className="flex items-center gap-1"
        >
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                filter === f
                  ? "bg-primary-100 text-primary-700"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="min-h-0 flex-1">
        {visible.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No conversations found.
          </p>
        ) : (
          <ul className="p-2">
            {visible.map((c) => {
              const contact = contacts[c.contactId]
              if (!contact) return null

              const companyName = contact.companyId
                ? (companies[contact.companyId]?.name ?? "")
                : ""
              const last = lastMessageOf(c)
              const isSelected = c.id === selectedId
              const ChannelIcon = CHANNEL_META[c.channel].icon

              return (
                <li key={c.id}>
                  <button
                    onClick={() => onSelect(c.id)}
                    aria-current={isSelected ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors",
                      isSelected
                        ? "bg-primary-50"
                        : "hover:bg-accent/60 focus-visible:bg-accent/60"
                    )}
                  >
                    <span className="relative shrink-0">
                      <Avatar className="size-9">
                        <AvatarFallback className="text-xs">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      {c.online && (
                        <span
                          className="absolute right-0 bottom-0 size-2.5 rounded-full bg-success ring-2 ring-surface"
                          aria-label="Online"
                        />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "truncate text-sm text-foreground",
                            c.unreadCount > 0 ? "font-semibold" : "font-medium"
                          )}
                        >
                          {contact.name}
                        </span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {formatListTimestamp(last.at)}
                        </span>
                      </span>

                      <span className="mt-0.5 flex items-center gap-1.5">
                        <ChannelIcon className="size-3 shrink-0 text-muted-foreground" />
                        <span className="truncate text-xs text-muted-foreground">
                          {companyName || contact.jobTitle}
                        </span>
                      </span>

                      <span className="mt-1 flex items-start gap-2">
                        <span
                          className={cn(
                            "line-clamp-1 flex-1 text-xs",
                            c.unreadCount > 0
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {last.author === "me" && "You: "}
                          {last.body}
                        </span>
                        {c.unreadCount > 0 && (
                          <Badge className="h-4.5 min-w-4.5 shrink-0 justify-center px-1 text-[10px]">
                            {c.unreadCount}
                          </Badge>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}

export default ConversationList
