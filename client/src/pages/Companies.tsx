import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import PageHeader from "@/components/common/PageHeader"
import DataTable from "@/components/common/DataTable"
import ConfirmDeleteModal from "@/components/pages/contacts/ConfirmDeleteModal"
import CompanyFormModal from "@/components/pages/companies/CompanyFormModal"
import { createCompanyColumns } from "@/components/pages/companies/columns"
import { Button } from "@/components/ui/button"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  companyAdded,
  companyRemoved,
  companyUpdated,
  selectAllCompanies,
  type CompanyDraft,
} from "@/store/companiesSlice"
import { selectAllContacts } from "@/store/contactsSlice"
import type { Company } from "@/types/crm"

const Companies = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const companies = useAppSelector(selectAllCompanies)
  const contacts = useAppSelector(selectAllContacts)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Company | null>(null)

  const countsByCompany = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of contacts) {
      if (c.companyId) map.set(c.companyId, (map.get(c.companyId) ?? 0) + 1)
    }
    return map
  }, [contacts])

  const columns = useMemo(
    () =>
      createCompanyColumns({
        contactCount: (id) => countsByCompany.get(id) ?? 0,
        onEdit: (company) => {
          setEditing(company)
          setFormOpen(true)
        },
        onDelete: (company) => setPendingDelete(company),
      }),
    [countsByCompany]
  )

  const handleSave = (draft: CompanyDraft) => {
    if (editing) {
      dispatch(companyUpdated({ id: editing.id, changes: draft }))
    } else {
      dispatch(companyAdded(draft))
    }
    setFormOpen(false)
    setEditing(null)
  }

  const linkedContacts = pendingDelete
    ? (countsByCompany.get(pendingDelete.id) ?? 0)
    : 0

  return (
    <>
      <PageHeader />
      <MainContentWrapper className="space-y-6 px-8">
        <DataTable
          columns={columns}
          data={companies}
          searchPlaceholder="Search companies..."
          onRowClick={(company) => navigate(`/companies/${company.id}`)}
          emptyMessage="No companies yet."
          actions={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus />
              New company
            </Button>
          }
        />
      </MainContentWrapper>

      <CompanyFormModal
        isOpen={formOpen}
        company={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) dispatch(companyRemoved(pendingDelete.id))
        }}
        title="Delete company"
        description={
          linkedContacts > 0
            ? `Delete ${pendingDelete?.name}? ${linkedContacts} contact${linkedContacts === 1 ? "" : "s"} will be left without a company.`
            : `Delete ${pendingDelete?.name}? This cannot be undone.`
        }
      />
    </>
  )
}

export default Companies
