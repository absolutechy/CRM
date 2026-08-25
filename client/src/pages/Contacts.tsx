import { useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import PageHeader from "@/components/common/PageHeader"
import DataTable from "@/components/common/DataTable"
import ConfirmDeleteModal from "@/components/pages/contacts/ConfirmDeleteModal"
import ContactFormModal from "@/components/pages/contacts/ContactFormModal"
import { createContactColumns } from "@/components/pages/contacts/columns"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  createContact,
  deleteContact,
  fetchContacts,
  selectAllContacts,
  selectContactsStatus,
  updateContact,
  type ContactDraft,
} from "@/store/contactsSlice"
import {
  fetchCompanies,
  selectAllCompanies,
  selectCompanyEntities,
} from "@/store/companiesSlice"
import type { Contact, ContactStatus } from "@/types/crm"

const Contacts = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const contacts = useAppSelector(selectAllContacts)
  const companies = useAppSelector(selectAllCompanies)
  const companyEntities = useAppSelector(selectCompanyEntities)
  const status = useAppSelector(selectContactsStatus)

  const [companyFilter, setCompanyFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load companies for the filter dropdown, and contacts whenever filters change.
  useEffect(() => {
    dispatch(fetchCompanies())
  }, [dispatch])

  useEffect(() => {
    dispatch(
      fetchContacts({
        ...(companyFilter !== "all" && { companyId: companyFilter }),
        ...(statusFilter !== "all" && { status: statusFilter as ContactStatus }),
      })
    )
  }, [dispatch, companyFilter, statusFilter])

  const companyName = useMemo(
    () => (id: string | null) => (id ? (companyEntities[id]?.name ?? "—") : "—"),
    [companyEntities]
  )

  // Coarse filters live outside TanStack so they read as CRM concepts;
  // search/sort/pagination stay inside the table.
  const visibleContacts = useMemo(
    () =>
      contacts.filter(
        (c) =>
          (companyFilter === "all" || c.companyId === companyFilter) &&
          (statusFilter === "all" || c.status === statusFilter)
      ),
    [contacts, companyFilter, statusFilter]
  )

  const columns = useMemo(
    () =>
      createContactColumns({
        companyName,
        onEdit: (contact) => {
          setEditing(contact)
          setFormOpen(true)
        },
        onDelete: (contact) => setPendingDelete(contact),
      }),
    [companyName]
  )

  const handleSave = async (draft: ContactDraft) => {
    setIsSaving(true)
    try {
      if (editing) {
        await dispatch(updateContact({ id: editing.id, changes: draft }))
      } else {
        await dispatch(createContact(draft))
      }
    } finally {
      setIsSaving(false)
      setFormOpen(false)
      setEditing(null)
    }
  }

  return (
    <>
      <PageHeader />
      <MainContentWrapper className="space-y-6 px-8">
        {status === "loading" && contacts.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
            Loading contacts…
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={visibleContacts}
            searchPlaceholder="Search name, company, email..."
            onRowClick={(contact) => navigate(`/contacts/${contact.id}`)}
            emptyMessage="No contacts match your filters."
            toolbar={
              <div className="flex items-center gap-2">
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger className="w-40" aria-label="Filter by company">
                    <SelectValue placeholder="Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All companies</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36" aria-label="Filter by status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
            actions={
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setFormOpen(true)
                }}
              >
                <Plus />
                New contact
              </Button>
            }
          />
        )}
      </MainContentWrapper>

      <ContactFormModal
        isOpen={formOpen}
        contact={editing}
        isLoading={isSaving}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        isOpen={!!pendingDelete}
        isLoading={isDeleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return
          setIsDeleting(true)
          try {
            await dispatch(deleteContact(pendingDelete.id))
          } finally {
            setIsDeleting(false)
            setPendingDelete(null)
          }
        }}
        title="Delete contact"
        description={`Delete ${pendingDelete?.name}? This also removes them from any company and message views. This cannot be undone.`}
      />
    </>
  )
}

export default Contacts
