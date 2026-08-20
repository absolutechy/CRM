import { useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Bold, Italic, List, ListOrdered } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

/** Shared TipTap wrapper — the editor dependency is already used by Notes. */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  className,
  minHeight = "10rem",
}) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose-sm focus:outline-none max-w-none",
      },
    },
  })

  // Keep the editor in sync when the caller swaps content (e.g. applying a template).
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return null

  const toolbarButton = (
    active: boolean,
    onClick: () => void,
    label: string,
    Icon: React.ElementType
  ) => (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(active && "bg-primary-100 text-primary-700")}
    >
      <Icon />
    </Button>
  )

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface focus-within:border-ring focus-within:ring-3 focus-within:ring-primary-200",
        className
      )}
    >
      <div className="flex items-center gap-0.5 border-b border-border p-1">
        {toolbarButton(
          editor.isActive("bold"),
          () => editor.chain().focus().toggleBold().run(),
          "Bold",
          Bold
        )}
        {toolbarButton(
          editor.isActive("italic"),
          () => editor.chain().focus().toggleItalic().run(),
          "Italic",
          Italic
        )}
        {toolbarButton(
          editor.isActive("bulletList"),
          () => editor.chain().focus().toggleBulletList().run(),
          "Bullet list",
          List
        )}
        {toolbarButton(
          editor.isActive("orderedList"),
          () => editor.chain().focus().toggleOrderedList().run(),
          "Numbered list",
          ListOrdered
        )}
      </div>
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="[&_.ProseMirror]:min-h-[inherit] [&_.ProseMirror]:p-3 [&_.ProseMirror]:text-sm [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5"
      />
    </div>
  )
}

export default RichTextEditor
