import { useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ArrowLeft, Megaphone, Plus, UserMinus } from "lucide-react"
import { Link, useParams } from "react-router"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import AudienceSelector from "@/components/pages/campaigns/AudienceSelector"
import CampaignFormModal from "@/components/pages/campaigns/CampaignFormModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CAMPAIGN_RESPONSE_BADGE,
  CAMPAIGN_STATUS_BADGE,
  CAMPAIGN_TYPE_LABEL,
  formatCurrency,
  formatDate,
} from "@/lib/crm"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  campaignUpdated,
  memberRemoved,
  memberResponseSet,
  membersAdded,
  selectCampaignById,
  selectCampaignPerformance,
  selectMembersByCampaignId,
  type CampaignDraft,
} from "@/store/campaignsSlice"
import { selectContactEntities } from "@/store/contactsSlice"
import { selectLeadEntities } from "@/store/leadsSlice"
import { selectUserNameById } from "@/store/usersSlice"
import type { RootState } from "@/store"
import type { CampaignResponse } from "@/types/crm"
import { CAMPAIGN_RESPONSES } from "@/types/crm"

const CampaignDetail = () => {
  const { id = "" } = useParams()
  const dispatch = useAppDispatch()

  const campaign = useAppSelector((s: RootState) => selectCampaignById(s, id))
  const members = useAppSelector((s: RootState) =>
    selectMembersByCampaignId(s, id)
  )
  const performance = useAppSelector((s: RootState) =>
    selectCampaignPerformance(s, id)
  )
  const contacts = useAppSelector(selectContactEntities)
  const leads = useAppSelector(selectLeadEntities)
  const ownerName = useAppSelector((s: RootState) =>
    selectUserNameById(s, campaign?.ownerId)
  )

  const [editOpen, setEditOpen] = useState(false)
  const [audienceOpen, setAudienceOpen] = useState(false)

  if (!campaign) {
    return (
      <MainContentWrapper className="px-8 py-16">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Campaign not found
          </h2>
          <Button asChild variant="outline">
            <Link to="/campaigns">
              <ArrowLeft />
              Back to campaigns
            </Link>
          </Button>
        </div>
      </MainContentWrapper>
    )
  }

  const funnel = [
    { stage: "Members", value: performance.total },
    { stage: "Opened", value: performance.opened },
    { stage: "Clicked", value: performance.clicked },
    { stage: "Replied", value: performance.replied },
    { stage: "Converted", value: performance.converted },
  ]

  return (
    <>
      <div className="border-b border-border bg-surface">
        <div className="flex flex-col gap-4 px-8 py-5 sm:flex-row sm:items-center">
          <Button asChild variant="ghost" size="icon-sm" className="self-start">
            <Link to="/campaigns" aria-label="Back to campaigns">
              <ArrowLeft />
            </Link>
          </Button>

          <span className="flex size-14 items-center justify-center rounded-lg bg-primary-100">
            <Megaphone className="size-7 text-primary-700" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {campaign.name}
              </h1>
              <Badge
                variant={CAMPAIGN_STATUS_BADGE[campaign.status]}
                className="capitalize"
              >
                {campaign.status}
              </Badge>
              <Badge variant="muted">{CAMPAIGN_TYPE_LABEL[campaign.type]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {campaign.goal || "No goal set"}
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        </div>
      </div>

      <MainContentWrapper className="space-y-6 px-8">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Audience", value: String(performance.total) },
                {
                  label: "Budget",
                  value: campaign.budget ? formatCurrency(campaign.budget) : "—",
                },
                { label: "Owner", value: ownerName },
                {
                  label: "Runs",
                  value: `${formatDate(campaign.startDate)}${campaign.endDate ? ` → ${formatDate(campaign.endDate)}` : ""}`,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-border bg-surface p-5"
                >
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="audience" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {members.length} member{members.length === 1 ? "" : "s"}
              </p>
              <Button size="sm" onClick={() => setAudienceOpen(true)}>
                <Plus />
                Add audience
              </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              {members.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  No audience yet — add contacts or leads to this campaign.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {members.map((m) => {
                    const person = m.contactId
                      ? contacts[m.contactId]
                      : m.leadId
                        ? leads[m.leadId]
                        : undefined
                    const href = m.contactId
                      ? `/contacts/${m.contactId}`
                      : `/leads/${m.leadId}`
                    return (
                      <li
                        key={m.id}
                        className="flex flex-wrap items-center gap-3 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            to={href}
                            className="block truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
                          >
                            {person?.name ?? "Unknown"}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {m.contactId ? "Contact" : "Lead"} · added{" "}
                            {formatDate(m.addedAt)}
                          </span>
                        </div>

                        <Badge variant={CAMPAIGN_RESPONSE_BADGE[m.response]}>
                          {m.response}
                        </Badge>

                        <Select
                          value={m.response}
                          onValueChange={(v) =>
                            dispatch(
                              memberResponseSet({
                                id: m.id,
                                response: v as CampaignResponse,
                              })
                            )
                          }
                        >
                          <SelectTrigger
                            className="w-32"
                            aria-label="Set response"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CAMPAIGN_RESPONSES.map((r) => (
                              <SelectItem key={r} value={r} className="capitalize">
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove from campaign"
                          onClick={() => dispatch(memberRemoved(m.id))}
                        >
                          <UserMinus />
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-surface p-5">
                <p className="text-xs text-muted-foreground">Open rate</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {performance.openRate}%
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-5">
                <p className="text-xs text-muted-foreground">Conversion rate</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {performance.conversionRate}%
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-5">
                <p className="text-xs text-muted-foreground">Converted</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {performance.converted}
                </p>
              </div>
            </div>

            <section className="rounded-lg border border-border bg-surface p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                Response funnel
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnel}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="stage"
                      stroke="var(--border)"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="var(--border)"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--primary-50)" }}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.5rem",
                        fontSize: "0.8125rem",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="var(--chart-1)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={56}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Response data is recorded manually until email tracking is
                connected to the backend.
              </p>
            </section>
          </TabsContent>
        </Tabs>
      </MainContentWrapper>

      <CampaignFormModal
        isOpen={editOpen}
        campaign={campaign}
        onClose={() => setEditOpen(false)}
        onSave={(draft: CampaignDraft) => {
          dispatch(campaignUpdated({ id: campaign.id, changes: draft }))
          setEditOpen(false)
        }}
      />

      <AudienceSelector
        isOpen={audienceOpen}
        onClose={() => setAudienceOpen(false)}
        existingContactIds={members.map((m) => m.contactId).filter(Boolean) as string[]}
        existingLeadIds={members.map((m) => m.leadId).filter(Boolean) as string[]}
        onAdd={({ contactIds, leadIds }) =>
          dispatch(membersAdded({ campaignId: campaign.id, contactIds, leadIds }))
        }
      />
    </>
  )
}

export default CampaignDetail
