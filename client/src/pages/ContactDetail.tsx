import { useState } from "react"
import {
  ArrowLeft,
  Merge,
  Pencil,
  Trash2,
  TriangleAlert,
} from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import ConfirmDeleteModal from "@/components/pages/contacts/ConfirmDeleteModal"
import ContactActivityTab from "@/components/pages/contacts/ContactActivityTab"
import ContactFormModal from "@/components/pages/contacts/ContactFormModal"
import ContactProfileTab from "@/components/pages/contacts/ContactProfileTab"
import ContactSalesTab from "@/components/pages/contacts/ContactSalesTab"
import DocumentsPanel from "@/components/pages/documents/DocumentsPanel"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CONTACT_STATUS_BADGE, getInitials } from "@/lib/crm"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  contactRemoved,
  contactUpdated,
  selectContactById,
  selectPotentialDuplicates,
  type ContactDraft,
} from "@/store/contactsSlice"
import { selectCompanyById } from "@/store/companiesSlice"
import { selectDocumentsByContactId } from "@/store/documentsSlice"
import type { RootState } from "@/store"

const ContactDetail = () => {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const contact = useAppSelector((s: RootState) => selectContactById(s, id))
  const company = useAppSelector((s: RootState) =>
    contact?.companyId ? selectCompanyById(s, contact.companyId) : undefined
  )
  const duplicates = useAppSelector((s: RootState) =>
    selectPotentialDuplicates(s, id)
  )
  const documents = useAppSelector((s: RootState) =>
    selectDocumentsByContactId(s, id)
  )

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!contact) {
    return (
      <MainContentWrapper className="px-8 py-16">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Contact not found
          </h2>
          <p className="text-sm text-muted-foreground">
            This contact may have been deleted.
          </p>
          <Button asChild variant="outline">
            <Link to="/contacts">
              <ArrowLeft />
              Back to contacts
            </Link>
          </Button>
        </div>
      </MainContentWrapper>
    )
  }

  const handleSave = (draft: ContactDraft) => {
    dispatch(contactUpdated({ id: contact.id, changes: draft }))
    setEditOpen(false)
  }

  return (
    <>
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="flex flex-col gap-4 px-8 py-5 sm:flex-row sm:items-center">
          <Button asChild variant="ghost" size="icon-sm" className="self-start">
            <Link to="/contacts" aria-label="Back to contacts">
              <ArrowLeft />
            </Link>
          </Button>

          <Avatar className="size-14">
            <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {contact.name}
              </h1>
              <Badge variant={CONTACT_STATUS_BADGE[contact.status]}>
                {contact.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {contact.jobTitle || "—"}
              {company && (
                <>
                  {" · "}
                  <Link
                    to={`/companies/${company.id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {company.name}
                  </Link>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <MainContentWrapper className="space-y-6 px-8">
        {/* Fragmentation guard — checklist item: avoid duplicate records */}
        {duplicates.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-warning-soft p-4">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-strong" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-warning-strong">
                Possible duplicate {duplicates.length === 1 ? "record" : "records"}
              </p>
              <p className="text-muted-foreground">
                {duplicates.map((d, i) => (
                  <span key={d.id}>
                    {i > 0 && ", "}
                    <Link
                      to={`/contacts/${d.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {d.name}
                    </Link>
                  </span>
                ))}{" "}
                share this email or name and company. Review and consolidate to
                keep one record per customer.
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Merge />
              Merge
            </Button>
          </div>
        )}

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ContactProfileTab contact={contact} company={company} />
          </TabsContent>
          <TabsContent value="activity" className="mt-6">
            <ContactActivityTab
              contactId={contact.id}
              companyId={contact.companyId}
            />
          </TabsContent>
          <TabsContent value="sales" className="mt-6">
            <ContactSalesTab contactId={contact.id} />
          </TabsContent>
          <TabsContent value="documents" className="mt-6">
            <DocumentsPanel
              documents={documents}
              fixedLink={{ type: "contact", id: contact.id }}
              showLinkedColumn={false}
              emptyMessage="No documents attached to this contact yet."
            />
          </TabsContent>
        </Tabs>
      </MainContentWrapper>

      <ContactFormModal
        isOpen={editOpen}
        contact={contact}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          dispatch(contactRemoved(contact.id))
          navigate("/contacts")
        }}
        title="Delete contact"
        description={`Delete ${contact.name}? This cannot be undone.`}
      />
    </>
  )
}

export default ContactDetail
