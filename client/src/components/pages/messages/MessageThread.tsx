import { Fragment, useEffect, useRef } from "react"
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react"
import { Link } from "react-router"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getInitials } from "@/lib/crm"
import { cn } from "@/lib/utils"
import { useAppSelector } from "@/store/hooks"
import { selectCompanyEntities } from "@/store/companiesSlice"
import { selectContactEntities } from "@/store/contactsSlice"

import type { Conversation } from "./data"
import MessageBubble from "./MessageBubble"
import MessageComposer from "./MessageComposer"
import { CHANNEL_META, dayKey, formatDayLabel } from "./utils"

interface MessageThreadProps {
  conversation: Conversation
  onSend: (body: string) => void
  onBack: () => void
  className?: string
}

const MessageThread: React.FC<MessageThreadProps> = ({
  conversation,
  onSend,
  onBack,
  className,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null)
  const contacts = useAppSelector(selectContactEntities)
  const companies = useAppSelector(selectCompanyEntities)
  const channel = CHANNEL_META[conversation.channel]
  const ChannelIcon = channel.icon

  const contact = contacts[conversation.contactId]
  const companyName = contact?.companyId
    ? (companies[contact.companyId]?.name ?? "")
    : ""

  // Keep the newest message in view when the thread or its length changes.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [conversation.id, conversation.messages.length])

  return (
    <section
      className={cn("flex min-w-0 flex-1 flex-col bg-background", className)}
    >
      {/* Thread header */}
      <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          className="md:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft />
        </Button>

        <span className="relative shrink-0">
          <Avatar className="size-9">
            <AvatarFallback className="text-xs">
              {getInitials(contact?.name ?? "?")}
            </AvatarFallback>
          </Avatar>
          {conversation.online && (
            <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-success ring-2 ring-surface" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-foreground">
              {contact ? (
                <Link
                  to={`/contacts/${contact.id}`}
                  className="hover:text-primary hover:underline"
                >
                  {contact.name}
                </Link>
              ) : (
                "Unknown contact"
              )}
            </h2>
            <Badge variant={channel.badge} className="gap-1">
              <ChannelIcon />
              {channel.label}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {[contact?.jobTitle, companyName].filter(Boolean).join(" · ")}
            {(contact?.jobTitle || companyName) && " · "}
            {conversation.online ? "Active now" : "Offline"}
          </p>
        </div>

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Start call">
                <Phone />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start call</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Start video call">
                <Video />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start video call</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Conversation options"
              >
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild disabled={!contact}>
                <Link to={contact ? `/contacts/${contact.id}` : "/contacts"}>
                  View contact
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Add to deal</DropdownMenuItem>
              <DropdownMenuItem>Mark as unread</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                Archive conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
        {conversation.messages.map((message, i) => {
          const prev = conversation.messages[i - 1]
          const showDay = !prev || dayKey(prev.at) !== dayKey(message.at)
          const isRunStart = !prev || prev.author !== message.author || showDay

          return (
            <Fragment key={message.id}>
              {showDay && (
                <div className="my-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {formatDayLabel(message.at)}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}
              <MessageBubble message={message} isRunStart={isRunStart} />
            </Fragment>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <MessageComposer
        recipient={(contact?.name ?? "").split(" ")[0] || "contact"}
        onSend={onSend}
      />
    </section>
  )
}

export default MessageThread
