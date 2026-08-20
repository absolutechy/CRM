import { useMemo, useState } from "react"
import { FolderOpen, HardDrive } from "lucide-react"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import PageHeader from "@/components/common/PageHeader"
import DocumentsPanel from "@/components/pages/documents/DocumentsPanel"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatFileSize } from "@/lib/crm"
import { useAppSelector } from "@/store/hooks"
import { selectAllDocuments } from "@/store/documentsSlice"
import { DOCUMENT_CATEGORIES } from "@/types/crm"

const Documents = () => {
  const documents = useAppSelector(selectAllDocuments)
  const [categoryFilter, setCategoryFilter] = useState("all")

  const visible = useMemo(
    () =>
      categoryFilter === "all"
        ? documents
        : documents.filter((d) => d.category === categoryFilter),
    [documents, categoryFilter]
  )

  const totalSize = documents.reduce((sum, d) => sum + d.sizeBytes, 0)

  return (
    <>
      <PageHeader />
      <MainContentWrapper className="space-y-6 px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <FolderOpen className="size-3.5" />
              Documents
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {documents.length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <HardDrive className="size-3.5" />
              Total size
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {formatFileSize(totalSize)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="text-xs text-muted-foreground">Storage</p>
            <p className="mt-1 text-sm font-medium text-warning-strong">
              Backend not connected
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              File contents aren't stored yet — details only.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44" aria-label="Filter by category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {DOCUMENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DocumentsPanel
          documents={visible}
          emptyMessage="No documents match this filter."
        />
      </MainContentWrapper>
    </>
  )
}

export default Documents
