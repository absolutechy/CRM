import { useEffect, useState } from "react"

import RichTextEditor from "@/components/common/RichTextEditor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { TEMPLATE_TOKENS } from "@/lib/emailTemplates"
import type { TemplateDraft } from "@/store/emailSlice"
import type { EmailTemplate } from "@/types/crm"

interface TemplateFormModalProps {
  isOpen: boolean
  template?: EmailTemplate | null
  onClose: () => void
  onSave: (draft: TemplateDraft) => void
  isLoading?: boolean
}

const emptyDraft = (): TemplateDraft => ({
  name: "",
  subject: "",
  body: "",
  category: "Sales",
})

const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
  isOpen,
  template,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [draft, setDraft] = useState<TemplateDraft>(emptyDraft)

  useEffect(() => {
    if (!isOpen) return
    if (template) {
      const { id: _id, updatedAt: _u, ...rest } = template
      setDraft(rest)
    } else {
      setDraft(emptyDraft())
    }
  }, [isOpen, template])

  const set = <K extends keyof TemplateDraft>(
    key: K,
    value: TemplateDraft[K]
  ) => setDraft((d) => ({ ...d, [key]: value }))

  const canSave = draft.name.trim() && draft.subject.trim()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={template ? "Edit template" : "New template"}
      className="max-w-3xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (canSave) onSave({ ...draft, name: draft.name.trim() })
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">Name *</Label>
            <Input
              id="tpl-name"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Follow-up after demo"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-category">Category</Label>
            <Input
              id="tpl-category"
              value={draft.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="Sales"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tpl-subject">Subject *</Label>
          <Input
            id="tpl-subject"
            value={draft.subject}
            onChange={(e) => set("subject", e.target.value)}
            placeholder="Recap + next steps"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>Body</Label>
          <RichTextEditor
            value={draft.body}
            onChange={(html) => set("body", html)}
            minHeight="14rem"
          />
        </div>

        <div className="rounded-lg border border-border bg-background p-3">
          <p className="mb-2 text-xs font-medium text-foreground">
            Available tokens
          </p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_TOKENS.map((t) => (
              <code
                key={t.token}
                title={t.label}
                className="rounded bg-primary-100 px-1.5 py-0.5 text-[11px] text-primary-700"
              >
                {t.token}
              </code>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave} loading={isLoading}>
            {template ? "Save changes" : "Create template"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default TemplateFormModal
