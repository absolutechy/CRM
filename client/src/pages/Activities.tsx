import { useMemo, useState } from "react"
import { useNavigate } from "react-router"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import PageHeader from "@/components/common/PageHeader"
import DataTable from "@/components/common/DataTable"
import { interactionColumns } from "@/components/pages/activities/columns"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { INTERACTION_META } from "@/lib/crm"
import { useAppSelector } from "@/store/hooks"
import { selectActors } from "@/store/activitiesSlice"
import { selectAllInteractions } from "@/store/selectors"
import { INTERACTION_TYPES, isInteractionType } from "@/types/crm"

const Activities = () => {
  const navigate = useNavigate()
  const rows = useAppSelector(selectAllInteractions)
  const actors = useAppSelector(selectActors)

  const [typeFilter, setTypeFilter] = useState("all")
  const [actorFilter, setActorFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("interactions")

  const visible = useMemo(
    () =>
      rows.filter(({ activity }) => {
        if (statusFilter === "interactions" && !isInteractionType(activity.type))
          return false
        if (statusFilter === "planned" && activity.status !== "planned")
          return false
        if (typeFilter !== "all" && activity.type !== typeFilter) return false
        if (actorFilter !== "all" && activity.actor !== actorFilter) return false
        return true
      }),
    [rows, typeFilter, actorFilter, statusFilter]
  )

  return (
    <>
      <PageHeader />
      <MainContentWrapper className="space-y-6 px-8">
        <DataTable
          columns={interactionColumns}
          data={visible}
          searchPlaceholder="Search interactions, contacts, companies..."
          onRowClick={(row) => navigate(`/contacts/${row.activity.contactId}`)}
          emptyMessage="No interactions match these filters."
          initialPageSize={20}
          toolbar={
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interactions">Interactions</SelectItem>
                  <SelectItem value="planned">Scheduled only</SelectItem>
                  <SelectItem value="all">All activity</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36" aria-label="Filter by type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {INTERACTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {INTERACTION_META[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={actorFilter} onValueChange={setActorFilter}>
                <SelectTrigger className="w-40" aria-label="Filter by team member">
                  <SelectValue placeholder="Team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  {actors.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
      </MainContentWrapper>
    </>
  )
}

export default Activities
