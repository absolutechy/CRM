import { useCallback } from "react"

import { useAppDispatch } from "@/store/hooks"
import { convertLead as convertLeadThunk } from "@/store/leadsSlice"
import type { ConvertOptions } from "@/services/leadsService"
import type { Lead } from "@/types/crm"

/**
 * Converts a lead into a contact/account via the API and returns the new ids.
 * The caller decides whether to navigate to the new contact or stay on the leads view.
 */
export const useConvertLead = () => {
  const dispatch = useAppDispatch()

  return useCallback(
    async (lead: Lead, options: ConvertOptions) => {
      const result = await dispatch(
        convertLeadThunk({ id: lead.id, options })
      ).unwrap()
      return result
    },
    [dispatch]
  )
}
