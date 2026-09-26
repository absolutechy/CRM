import { useState } from "react"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Textarea } from "@/components/ui/textarea"

interface PasteModalProps {
  isOpen: boolean
  isExtracting: boolean
  onClose: () => void
  onExtract: (text: string, sourceLabel: string) => void
}

/**
 * Deliberately a plain Textarea rather than the TipTap editor: the model wants
 * the raw text, and TipTap round-trips through HTML and is kept out of every
 * bundle but Notes.
 */
const PasteModal = ({ isOpen, isExtracting, onClose, onExtract }: PasteModalProps) => {
  const [text, setText] = useState("")
  const [label, setLabel] = useState("")

  const close = () => {
    setText("")
    setLabel("")
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title="Paste anything" className="max-w-2xl">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          An email thread, a WhatsApp export, meeting notes, a transcript, a signature.
          Nothing is saved to the CRM until you approve it.
        </p>

        <div className="space-y-1.5">
          <label htmlFor="source-label" className="text-sm font-medium text-foreground">
            What is this? <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="source-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Call with Sarah, 12 Oct"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="source-text" className="text-sm font-medium text-foreground">
            Source text
          </label>
          <Textarea
            id="source-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste here…"
            className="min-h-64 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">{text.length} characters</p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close} disabled={isExtracting}>
            Cancel
          </Button>
          <Button
            onClick={() => onExtract(text, label)}
            loading={isExtracting}
            disabled={text.trim().length < 20}
          >
            <Sparkles />
            Extract changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default PasteModal
