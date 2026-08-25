import { useEffect, useMemo, useState } from "react"
import { CloudCog, FolderOpen, HardDrive } from "lucide-react"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import PageHeader from "@/components/common/PageHeader"
import StatCard from "@/components/pages/dashboard/StatCard"
import DocumentsPanel from "@/components/pages/documents/DocumentsPanel"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatFileSize } from "@/lib/crm"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  fetchDocuments,
  selectAllDocuments,
  selectDocumentsStatus,
} from "@/store/documentsSlice"
import { DOCUMENT_CATEGORIES } from "@/types/crm"

const Documents = () => {
  const dispatch = useAppDispatch()
  const documents = useAppSelector(selectAllDocuments)
  const status = useAppSelector(selectDocumentsStatus)
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    dispatch(fetchDocuments())
  }, [dispatch])

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
          <StatCard
            icon={FolderOpen}
            title="Documents"
            value={String(documents.length)}
            subtitle="Total files"
            tone="default"
            sparkline={[6, 8, 7, 9, 8, 11, 10, 12, 13, 14, 16]}
          />
          <StatCard
            icon={HardDrive}
            title="Total size"
            value={formatFileSize(totalSize)}
            subtitle="Stored in object storage"
            tone="info"
            sparkline={[4, 5, 5, 7, 6, 8, 9, 8, 10, 11, 12]}
          />
          <StatCard
            icon={CloudCog}
            title="Storage"
            value={status === "loading" ? "…" : "Connected"}
            subtitle="Files are stored in object storage"
            tone="success"
            sparkline={[2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7]}
          />
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

        {status === "loading" && documents.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
            Loading documents…
          </div>
        ) : (
          <DocumentsPanel
            documents={visible}
            emptyMessage="No documents match this filter."
          />
        )}
      </MainContentWrapper>
    </>
  )
}

export default Documents
