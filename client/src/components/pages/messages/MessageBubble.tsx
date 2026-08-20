import { Check, CheckCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Message } from "./data"
import { formatTime } from "./utils"

interface MessageBubbleProps {
  message: Message
  /** First in a run from the same author — controls avatar gutter + corner shape. */
  isRunStart: boolean
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isRunStart,
}) => {
  const isMine = message.author === "me"

  return (
    <div
      className={cn(
        "flex w-full",
        isMine ? "justify-end" : "justify-start",
        isRunStart ? "mt-3" : "mt-0.5"
      )}
    >
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2 sm:max-w-[65%]",
          isMine
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-muted text-foreground",
          // Flatten the corner nearest the speaker on the last bubble of a run.
          isMine ? "rounded-br-md" : "rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.body}
        </p>
        <div
          className={cn(
            "mt-1 flex items-center gap-1",
            isMine ? "justify-end" : "justify-start"
          )}
        >
          <span
            className={cn(
              "text-[10px] tabular-nums",
              isMine ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {formatTime(message.at)}
          </span>
          {isMine &&
            (message.status === "read" ? (
              <CheckCheck className="size-3 text-primary-foreground" />
            ) : message.status === "delivered" ? (
              <CheckCheck className="size-3 text-primary-foreground/60" />
            ) : (
              <Check className="size-3 text-primary-foreground/60" />
            ))}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
