import { useState } from "react"
import {
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  ExternalLink,
  Mail,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import ConfirmDeleteModal from "@/components/pages/contacts/ConfirmDeleteModal"
import InteractionComposer from "@/components/pages/activities/InteractionComposer"
import InteractionTimeline from "@/components/pages/activities/InteractionTimeline"
import ConvertLeadModal, {
  type ConvertOptions,
} from "@/components/pages/leads/ConvertLeadModal"
import LeadFormModal from "@/components/pages/leads/LeadFormModal"
import DocumentsPanel from "@/components/pages/documents/DocumentsPanel"
import { useConvertLead } from "@/components/pages/leads/useConvertLead"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LEAD_SOURCE_LABEL,
  LEAD_STATUS_BADGE,
  LEAD_STATUS_LABEL,
  formatCurrency,
  formatDate,
  getInitials,
} from "@/lib/crm"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { activityLogged } from "@/store/activitiesSlice"
import { selectCampaignById } from "@/store/campaignsSlice"
import { selectDocumentsByLeadId } from "@/store/documentsSlice"
import {
  leadRemoved,
  leadUpdated,
  selectLeadById,
  type LeadDraft,
} from "@/store/leadsSlice"
import { selectTimelineForLead } from "@/store/selectors"
import { selectUserNameById } from "@/store/usersSlice"
import type { RootState } from "@/store"

const LeadDetail = () => {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const convertLead = useConvertLead()

  const lead = useAppSelector((s: RootState) => selectLeadById(s, id))
  const timeline = useAppSelector((s: RootState) => selectTimelineForLead(s, id))
  const ownerName = useAppSelector((s: RootState) =>
    selectUserNameById(s, lead?.ownerId)
  )
  const documents = useAppSelector((s: RootState) =>
    selectDocumentsByLeadId(s, id)
  )
  const campaign = useAppSelector((s: RootState) =>
    lead?.campaignId ? selectCampaignById(s, lead.campaignId) : undefined
  )

  const [editOpen, setEditOpen] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!lead) {
    return (
      <MainContentWrapper className="px-8 py-16">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Lead not found
          </h2>
          <Button asChild variant="outline">
            <Link to="/leads">
              <ArrowLeft />
              Back to leads
            </Link>
          </Button>
        </div>
      </MainContentWrapper>
    )
  }

  const isConverted = lead.status === "converted"

  return (
    <>
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="flex flex-col gap-4 px-8 py-5 sm:flex-row sm:items-center">
          <Button asChild variant="ghost" size="icon-sm" className="self-start">
            <Link to="/leads" aria-label="Back to leads">
              <ArrowLeft />
            </Link>
          </Button>

          <Avatar className="size-14">
            <AvatarFallback>{getInitials(lead.name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{lead.name}</h1>
              <Badge variant={LEAD_STATUS_BADGE[lead.status]}>
                {LEAD_STATUS_LABEL[lead.status]}
              </Badge>
              <Badge variant="muted">{LEAD_SOURCE_LABEL[lead.source]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {[lead.jobTitle, lead.companyName].filter(Boolean).join(" · ") ||
                "—"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit
            </Button>
            <Button
              size="sm"
              onClick={() => setConvertOpen(true)}
              disabled={isConverted}
            >
              <ArrowRightLeft />
              Convert
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete lead"
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      </div>

      <MainContentWrapper className="space-y-6 px-8">
        {isConverted && lead.convertedContactId && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-success-soft p-4">
            <p className="text-sm text-success-strong">
              This lead was converted into a contact.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to={`/contacts/${lead.convertedContactId}`}>
                <ExternalLink />
                Open contact
              </Link>
            </Button>
          </div>
        )}

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="space-y-4 rounded-lg border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold text-foreground">
                  Contact details
                </h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-muted-foreground" />
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-primary hover:underline"
                    >
                      {lead.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="size-4 text-muted-foreground" />
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-primary hover:underline"
                      >
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Not provided</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 className="size-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {lead.companyName || "—"}
                    </span>
                  </div>
                </dl>
                {lead.notes && (
                  <p className="border-t border-border pt-3 text-sm whitespace-pre-wrap text-muted-foreground">
                    {lead.notes}
                  </p>
                )}
              </section>

              <section className="space-y-3 rounded-lg border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold text-foreground">
                  Qualification
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Owner</dt>
                    <dd className="text-foreground">{ownerName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Estimated value</dt>
                    <dd className="font-medium text-foreground">
                      {lead.estimatedValue
                        ? formatCurrency(lead.estimatedValue)
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Source</dt>
                    <dd className="text-foreground">
                      {LEAD_SOURCE_LABEL[lead.source]}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Campaign</dt>
                    <dd>
                      {campaign ? (
                        <Link
                          to={`/campaigns/${campaign.id}`}
                          className="text-primary hover:underline"
                        >
                          {campaign.name}
                        </Link>
                      ) : (
                        <span className="text-foreground">—</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Created</dt>
                    <dd className="text-foreground">
                      {formatDate(lead.createdAt)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Last updated</dt>
                    <dd className="text-foreground">
                      {formatDate(lead.updatedAt)}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <InteractionComposer
                  leadId={lead.id}
                  companyId={null}
                  onLog={(draft) => dispatch(activityLogged(draft))}
                />
              </div>
              <div className="lg:col-span-2">
                <InteractionTimeline entries={timeline} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <DocumentsPanel
              documents={documents}
              fixedLink={{ type: "lead", id: lead.id }}
              showLinkedColumn={false}
              emptyMessage="No documents attached to this lead yet."
            />
          </TabsContent>
        </Tabs>
      </MainContentWrapper>

      <LeadFormModal
        isOpen={editOpen}
        lead={lead}
        onClose={() => setEditOpen(false)}
        onSave={(draft: LeadDraft) => {
          dispatch(leadUpdated({ id: lead.id, changes: draft }))
          setEditOpen(false)
        }}
      />

      <ConvertLeadModal
        isOpen={convertOpen}
        lead={lead}
        onClose={() => setConvertOpen(false)}
        onConvert={(l, options: ConvertOptions) => {
          const { contactId } = convertLead(l, options)
          navigate(`/contacts/${contactId}`)
        }}
      />

      <ConfirmDeleteModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          dispatch(leadRemoved(lead.id))
          navigate("/leads")
        }}
        title="Delete lead"
        description={`Delete ${lead.name}? This cannot be undone.`}
      />
    </>
  )
}

export default LeadDetail
