import { useState } from "react"

import ConfirmDeleteModal from "@/components/pages/contacts/ConfirmDeleteModal"
import InteractionComposer from "@/components/pages/activities/InteractionComposer"
import InteractionFormModal from "@/components/pages/activities/InteractionFormModal"
import InteractionTimeline from "@/components/pages/activities/InteractionTimeline"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  createActivity,
  deleteActivity,
  updateActivity,
  type ActivityDraft,
} from "@/store/activitiesSlice"
import { selectTimelineForContact } from "@/store/selectors"
import type { RootState } from "@/store"
import type { Activity } from "@/types/crm"

interface ContactActivityTabProps {
  contactId: string
  companyId: string | null
}

const ContactActivityTab: React.FC<ContactActivityTabProps> = ({
  contactId,
  companyId,
}) => {
  const dispatch = useAppDispatch()
  const entries = useAppSelector((s: RootState) =>
    selectTimelineForContact(s, contactId)
  )

  const [editing, setEditing] = useState<Activity | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Activity | null>(null)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <InteractionComposer
          contactId={contactId}
          companyId={companyId}
          onLog={(draft: ActivityDraft) => dispatch(createActivity(draft))}
        />
      </div>

      <div className="lg:col-span-2">
        <InteractionTimeline
          entries={entries}
          onEdit={setEditing}
          onDelete={setPendingDelete}
        />
      </div>

      <InteractionFormModal
        isOpen={!!editing}
        activity={editing}
        onClose={() => setEditing(null)}
        onSave={(id, changes) => dispatch(updateActivity({ id, changes }))}
      />

      <ConfirmDeleteModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) dispatch(deleteActivity(pendingDelete.id))
          setPendingDelete(null)
        }}
        title="Delete interaction"
        description={`Delete "${pendingDelete?.summary}"? This removes it from the customer's history.`}
      />
    </div>
  )
}

export default ContactActivityTab
