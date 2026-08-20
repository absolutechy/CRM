import { useCallback } from "react"
import { nanoid } from "@reduxjs/toolkit"

import { useAppDispatch, useAppStore } from "@/store/hooks"
import { activityLogged, activityUpdated } from "@/store/activitiesSlice"
import { companyAdded } from "@/store/companiesSlice"
import { contactAdded } from "@/store/contactsSlice"
import { leadConverted, leadRemoved } from "@/store/leadsSlice"
import { selectActivitiesByLeadId } from "@/store/activitiesSlice"
import { EMPTY_ADDRESS, EMPTY_SOCIAL, type Lead } from "@/types/crm"
import type { ConvertOptions } from "./ConvertLeadModal"

/**
 * Converting a lead creates a contact (and optionally an account), then
 * re-parents the lead's interaction history onto the new contact so nothing is
 * lost — this is the join between Lead Management and Contact Management.
 */
export const useConvertLead = () => {
  const dispatch = useAppDispatch()
  const store = useAppStore()

  return useCallback(
    (lead: Lead, options: ConvertOptions) => {
      // 1. Resolve the account.
      let companyId = options.companyId
      if (options.createCompany && lead.companyName.trim()) {
        companyId = nanoid()
        dispatch(
          companyAdded({
            id: companyId,
            name: lead.companyName.trim(),
            industry: "",
            website: "",
            location: "",
            status: "active",
          })
        )
      }

      // 2. Create the contact.
      const contactId = nanoid()
      dispatch(
        contactAdded({
          id: contactId,
          name: lead.name,
          jobTitle: lead.jobTitle,
          email: lead.email,
          phone: lead.phone,
          companyId,
          address: { ...EMPTY_ADDRESS },
          social: { ...EMPTY_SOCIAL },
          status: "Active",
          tags: ["converted-lead"],
        })
      )

      // 3. Move the lead's interaction history onto the contact.
      const history = selectActivitiesByLeadId(store.getState(), lead.id)
      for (const activity of history) {
        dispatch(
          activityUpdated({
            id: activity.id,
            changes: { contactId, companyId },
          })
        )
      }

      // 4. Record the conversion itself on the timeline.
      dispatch(
        activityLogged({
          contactId,
          leadId: options.keepLead ? lead.id : null,
          companyId,
          type: "status_change",
          summary: "Converted from lead",
          body: `Lead created ${new Date(lead.createdAt).toLocaleDateString()} via ${lead.source}.`,
          actor: "John Doe",
        })
      )

      // 5. Keep or discard the lead record.
      if (options.keepLead) {
        dispatch(leadConverted({ id: lead.id, contactId, companyId }))
      } else {
        dispatch(leadRemoved(lead.id))
      }

      return { contactId, companyId }
    },
    [dispatch, store]
  )
}
