import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ArrowLeft, CalendarRange, CheckCircle2, MailOpen, Megaphone, MousePointerClick, Plus, UserCircle, UserMinus, Users, Wallet } from "lucide-react"
import { Link, useParams } from "react-router"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import StatCard from "@/components/pages/dashboard/StatCard"
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
  addCampaignMembers,
  changeMemberResponse,
  fetchCampaign,
  fetchMembers,
  removeCampaignMember,
  selectCampaignById,
  selectCampaignPerformance,
  selectCampaignsStatus,
  selectMembersByCampaignId,
  updateCampaign,
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
  const status = useAppSelector(selectCampaignsStatus)
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
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (id) {
      dispatch(fetchCampaign(id))
      dispatch(fetchMembers(id))
    }
  }, [dispatch, id])

  if (status === "loading" && !campaign) {
    return (
      <MainContentWrapper className="px-8 py-16 text-center text-sm text-muted-foreground">
        Loading campaign…
      </MainContentWrapper>
    )
  }

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
              <StatCard
                icon={Users}
                title="Audience"
                value={String(performance.total)}
                subtitle="Members in campaign"
                tone="default"
                sparkline={[10, 12, 11, 15, 14, 18, 17, 20, 22, 24, 26]}
              />
              <StatCard
                icon={Wallet}
                title="Budget"
                value={campaign.budget ? formatCurrency(campaign.budget) : "—"}
                subtitle="Campaign budget"
                tone="success"
                sparkline={[20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25]}
              />
              <StatCard
                icon={UserCircle}
                title="Owner"
                value={ownerName}
                subtitle="Campaign owner"
                tone="info"
                sparkline={[5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10]}
              />
              <StatCard
                icon={CalendarRange}
                title="Runs"
                value={`${formatDate(campaign.startDate)}${campaign.endDate ? ` → ${formatDate(campaign.endDate)}` : ""}`}
                subtitle="Schedule window"
                tone="warning"
                sparkline={[3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8]}
              />
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
                              changeMemberResponse({
                                campaignId: campaign.id,
                                memberId: m.id,
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
                          onClick={() =>
                            dispatch(
                              removeCampaignMember({
                                campaignId: campaign.id,
                                memberId: m.id,
                              })
                            )
                          }
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
              <StatCard
                icon={MailOpen}
                title="Open rate"
                value={`${performance.openRate}%`}
                subtitle="Of all members"
                tone="info"
                sparkline={[30, 35, 33, 40, 38, 42, 45, 43, 48, 46, 50]}
              />
              <StatCard
                icon={MousePointerClick}
                title="Conversion rate"
                value={`${performance.conversionRate}%`}
                subtitle="Converted members"
                tone="success"
                sparkline={[8, 10, 9, 12, 11, 14, 13, 16, 15, 18, 20]}
              />
              <StatCard
                icon={CheckCircle2}
                title="Converted"
                value={String(performance.converted)}
                subtitle="Total conversions"
                tone="default"
                sparkline={[2, 3, 3, 4, 5, 4, 6, 5, 7, 6, 8]}
              />
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
        isLoading={isSaving}
        onClose={() => setEditOpen(false)}
        onSave={async (draft: CampaignDraft) => {
          setIsSaving(true)
          try {
            await dispatch(
              updateCampaign({ id: campaign.id, changes: draft })
            )
          } finally {
            setIsSaving(false)
            setEditOpen(false)
          }
        }}
      />

      <AudienceSelector
        isOpen={audienceOpen}
        onClose={() => setAudienceOpen(false)}
        existingContactIds={members.map((m) => m.contactId).filter(Boolean) as string[]}
        existingLeadIds={members.map((m) => m.leadId).filter(Boolean) as string[]}
        onAdd={({ contactIds, leadIds }) => {
          dispatch(
            addCampaignMembers({
              campaignId: campaign.id,
              contactIds,
              leadIds,
            })
          )
          setAudienceOpen(false)
        }}
      />
    </>
  )
}

export default CampaignDetail
