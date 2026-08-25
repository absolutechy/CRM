import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileType,
  Image as ImageIcon,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react"
import { Link } from "react-router"

import DataTable from "@/components/common/DataTable"
import ConfirmDeleteModal from "@/components/pages/contacts/ConfirmDeleteModal"
import DocumentUploadModal from "@/components/pages/documents/DocumentUploadModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DOCUMENT_CATEGORY_BADGE, formatDate, formatFileSize } from "@/lib/crm"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { deleteDocument } from "@/store/documentsSlice"
import { downloadDocument } from "@/services/documentService"
import { selectCompanyEntities } from "@/store/companiesSlice"
import { selectContactEntities } from "@/store/contactsSlice"
import { selectLeadEntities } from "@/store/leadsSlice"
import { selectUserEntities } from "@/store/usersSlice"
import type { CrmDocument } from "@/types/crm"

const iconFor = (mimeType: string) => {
  if (mimeType.includes("sheet") || mimeType.includes("excel"))
    return FileSpreadsheet
  if (mimeType.startsWith("image/")) return ImageIcon
  if (mimeType.includes("pdf")) return FileType
  return FileText
}

interface DocumentsPanelProps {
  documents: CrmDocument[]
  /** Pre-links uploads and hides the linked-record column. */
  fixedLink?: { type: "contact" | "company" | "lead"; id: string }
  showLinkedColumn?: boolean
  emptyMessage?: string
}

const DocumentsPanel: React.FC<DocumentsPanelProps> = ({
  documents,
  fixedLink,
  showLinkedColumn = true,
  emptyMessage = "No documents yet.",
}) => {
  const dispatch = useAppDispatch()
  const contacts = useAppSelector(selectContactEntities)
  const companies = useAppSelector(selectCompanyEntities)
  const leads = useAppSelector(selectLeadEntities)
  const users = useAppSelector(selectUserEntities)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<CrmDocument | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDownload = async (doc: CrmDocument) => {
    const res = await downloadDocument(doc.id)
    if (res.ok && res.data) {
      window.open(res.data, "_blank", "noopener,noreferrer")
    } else {
      // Surface a toast-like fallback: alert is heavy, but there's no other
      // global toast from here. Keep it minimal.
      window.alert(res.message)
    }
  }

  const linkedLabel = (doc: CrmDocument) => {
    if (doc.contactId) return contacts[doc.contactId]?.name ?? "—"
    if (doc.companyId) return companies[doc.companyId]?.name ?? "—"
    if (doc.leadId) return leads[doc.leadId]?.name ?? "—"
    return "—"
  }

  const linkedHref = (doc: CrmDocument) =>
    doc.contactId
      ? `/contacts/${doc.contactId}`
      : doc.companyId
        ? `/companies/${doc.companyId}`
        : doc.leadId
          ? `/leads/${doc.leadId}`
          : null

  const columns = useMemo<ColumnDef<CrmDocument>[]>(() => {
    const base: ColumnDef<CrmDocument>[] = [
      {
        accessorKey: "name",
        header: "Document",
        cell: ({ row }) => {
          const Icon = iconFor(row.original.mimeType)
          return (
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-100">
                <Icon className="size-4 text-primary-700" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {row.original.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(row.original.sizeBytes)}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge
            variant={DOCUMENT_CATEGORY_BADGE[row.original.category]}
            className="capitalize"
          >
            {row.original.category}
          </Badge>
        ),
      },
    ]

    if (showLinkedColumn) {
      base.push({
        id: "linked",
        accessorFn: linkedLabel,
        header: "Linked to",
        cell: ({ row, getValue }) => {
          const href = linkedHref(row.original)
          return href ? (
            <Link
              to={href}
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-primary hover:underline"
            >
              {getValue<string>()}
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
      })
    }

    base.push(
      {
        id: "uploadedBy",
        accessorFn: (d) => users[d.uploadedById]?.name ?? "—",
        header: "Uploaded by",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "uploadedAt",
        header: "Uploaded",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDate(row.original.uploadedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${row.original.name}`}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => handleDownload(row.original)}>
                  <Download />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setPendingDelete(row.original)}
                >
                  <Trash2 />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      }
    )

    return base
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts, companies, leads, users, showLinkedColumn])

  return (
    <>
      <DataTable
        columns={columns}
        data={documents}
        searchPlaceholder="Search documents..."
        emptyMessage={emptyMessage}
        actions={
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus />
            Upload
          </Button>
        }
      />

      <DocumentUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        fixedLink={fixedLink}
      />

      <ConfirmDeleteModal
        isOpen={!!pendingDelete}
        isLoading={isDeleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return
          setIsDeleting(true)
          try {
            await dispatch(deleteDocument(pendingDelete.id))
          } finally {
            setIsDeleting(false)
            setPendingDelete(null)
          }
        }}
        title="Remove document"
        description={`Remove "${pendingDelete?.name}" from this record?`}
      />
    </>
  )
}

export default DocumentsPanel
