import { useEffect, useRef, useState } from "react"
import { FileUp, Info, Paperclip, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatFileSize } from "@/lib/crm"
import { cn } from "@/lib/utils"
import { uploadDocument } from "@/services/documentService"
import { useAppSelector } from "@/store/hooks"
import { selectAllCompanies } from "@/store/companiesSlice"
import { selectAllContacts } from "@/store/contactsSlice"
import { selectAllLeads } from "@/store/leadsSlice"
import type { DocumentDraft } from "@/store/documentsSlice"
import { CURRENT_USER_ID } from "@/store/usersSlice"
import type { DocumentCategory } from "@/types/crm"
import { DOCUMENT_CATEGORIES } from "@/types/crm"

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (draft: DocumentDraft) => void
  /** Pre-links the upload when opened from a record's Documents tab. */
  fixedLink?: { type: "contact" | "company" | "lead"; id: string }
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  fixedLink,
}) => {
  const contacts = useAppSelector(selectAllContacts)
  const companies = useAppSelector(selectAllCompanies)
  const leads = useAppSelector(selectAllLeads)

  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [category, setCategory] = useState<DocumentCategory>("proposal")
  const [linkKey, setLinkKey] = useState("")
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setFiles([])
    setCategory("proposal")
    setNotice(null)
    setLinkKey(fixedLink ? `${fixedLink.type}:${fixedLink.id}` : "")
  }, [isOpen, fixedLink])

  const linkOptions = [
    ...contacts.map((c) => ({ key: `contact:${c.id}`, label: `${c.name} (contact)` })),
    ...companies.map((c) => ({ key: `company:${c.id}`, label: `${c.name} (account)` })),
    ...leads.map((l) => ({ key: `lead:${l.id}`, label: `${l.name} (lead)` })),
  ]

  const addFiles = (list: FileList | null) => {
    if (list) setFiles((prev) => [...prev, ...Array.from(list)])
  }

  const canUpload = files.length > 0 && linkKey !== ""

  const handleUpload = async () => {
    const [type, id] = linkKey.split(":")
    for (const file of files) {
      // Metadata only — the service records nothing yet, storage is backend work.
      const res = await uploadDocument({
        file,
        category,
        contactId: type === "contact" ? id : null,
        companyId: type === "company" ? id : null,
        leadId: type === "lead" ? id : null,
        uploadedById: CURRENT_USER_ID,
      })
      onUpload({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        category,
        contactId: type === "contact" ? id : null,
        companyId: type === "company" ? id : null,
        leadId: type === "lead" ? id : null,
        uploadedById: CURRENT_USER_ID,
      })
      setNotice(res.message)
    }
    setFiles([])
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload documents"
      className="max-w-lg"
    >
      <div className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            addFiles(e.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors",
            dragging
              ? "border-primary bg-primary-50"
              : "border-border hover:bg-accent/60"
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary-100">
            <FileUp className="size-5 text-primary-700" />
          </span>
          <p className="text-sm font-medium text-foreground">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, Word, Excel and images
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {/* Selected files */}
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 rounded-md border border-border p-2.5"
              >
                <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  <Progress value={100} className="mt-1.5 h-1" />
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((f) => f.filter((_, x) => x !== i))}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="doc-category">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as DocumentCategory)}
            >
              <SelectTrigger id="doc-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-link">Linked record *</Label>
            <Select
              value={linkKey}
              onValueChange={setLinkKey}
              disabled={!!fixedLink}
            >
              <SelectTrigger id="doc-link" className="w-full">
                <SelectValue placeholder="Select a record" />
              </SelectTrigger>
              <SelectContent>
                {linkOptions.map((o) => (
                  <SelectItem key={o.key} value={o.key}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Honest backend state */}
        {notice && (
          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-info-soft p-3">
            <Info className="mt-0.5 size-4 shrink-0 text-info-strong" />
            <p className="text-sm text-muted-foreground">{notice}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleUpload} disabled={!canUpload}>
            Upload {files.length > 0 && `(${files.length})`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default DocumentUploadModal
