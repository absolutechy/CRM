import { useRef, useState } from "react"
import { Paperclip, SendHorizontal, Smile } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MessageComposerProps {
  recipient: string
  onSend: (body: string) => void
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  recipient,
  onSend,
}) => {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const body = value.trim()
    if (!body) return
    onSend(body)
    setValue("")
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-border bg-surface p-3">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-surface p-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-primary-200">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={`Message ${recipient}...`}
          aria-label={`Message ${recipient}`}
          className="max-h-32 min-h-9 flex-1 resize-none border-0 bg-transparent px-1.5 py-1.5 shadow-none focus-visible:border-0 focus-visible:ring-0"
        />

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Attach file">
                <Paperclip />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach file</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Insert emoji">
                <Smile />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert emoji</TooltipContent>
          </Tooltip>

          <Button
            size="icon-sm"
            onClick={submit}
            disabled={!value.trim()}
            aria-label="Send message"
          >
            <SendHorizontal />
          </Button>
        </div>
      </div>

      <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
        <kbd className="font-sans font-medium">Enter</kbd> to send ·{" "}
        <kbd className="font-sans font-medium">Shift+Enter</kbd> for a new line
      </p>
    </div>
  )
}

export default MessageComposer
