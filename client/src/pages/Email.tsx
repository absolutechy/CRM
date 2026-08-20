import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  CheckCircle2,
  Mail,
  MailOpen,
  MousePointerClick,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Unplug,
} from "lucide-react"
import { Link } from "react-router"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import PageHeader from "@/components/common/PageHeader"
import DataTable from "@/components/common/DataTable"
import ConfirmDeleteModal from "@/components/pages/contacts/ConfirmDeleteModal"
import EmailComposeModal from "@/components/pages/email/EmailComposeModal"
import TemplateFormModal from "@/components/pages/email/TemplateFormModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  EMAIL_STATUS_BADGE,
  formatDate,
  stripHtml,
} from "@/lib/crm"
import { connectAccount, syncAccount } from "@/services/emailService"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectContactEntities } from "@/store/contactsSlice"
import {
  selectAllEmailAccounts,
  selectAllEmails,
  selectAllTemplates,
  selectEmailStats,
  templateAdded,
  templateRemoved,
  templateUpdated,
  type TemplateDraft,
} from "@/store/emailSlice"
import { selectLeadEntities } from "@/store/leadsSlice"
import type { EmailMessage, EmailTemplate } from "@/types/crm"

const Email = () => {
  const dispatch = useAppDispatch()

  const emails = useAppSelector(selectAllEmails)
  const templates = useAppSelector(selectAllTemplates)
  const accounts = useAppSelector(selectAllEmailAccounts)
  const stats = useAppSelector(selectEmailStats)
  const contacts = useAppSelector(selectContactEntities)
  const leads = useAppSelector(selectLeadEntities)

  const [composeOpen, setComposeOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null
  )
  const [pendingDelete, setPendingDelete] = useState<EmailTemplate | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const emailColumns = useMemo<ColumnDef<EmailMessage>[]>(
    () => [
      {
        accessorKey: "subject",
        header: "Subject",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {row.original.subject}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {stripHtml(row.original.body).slice(0, 80)}
            </p>
          </div>
        ),
      },
      {
        id: "recipient",
        accessorFn: (e) =>
          e.contactId
            ? (contacts[e.contactId]?.name ?? "")
            : e.leadId
              ? (leads[e.leadId]?.name ?? "")
              : e.to.join(", "),
        header: "Recipient",
        cell: ({ row, getValue }) => {
          const e = row.original
          const to = e.contactId
            ? `/contacts/${e.contactId}`
            : e.leadId
              ? `/leads/${e.leadId}`
              : null
          return to ? (
            <Link
              to={to}
              onClick={(ev) => ev.stopPropagation()}
              className="text-muted-foreground hover:text-primary hover:underline"
            >
              {getValue<string>()}
            </Link>
          ) : (
            <span className="text-muted-foreground">{getValue<string>()}</span>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={EMAIL_STATUS_BADGE[row.original.status]}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "engagement",
        accessorFn: (e) => (e.clickedAt ? 2 : e.openedAt ? 1 : 0),
        header: "Engagement",
        cell: ({ row }) => {
          const e = row.original
          if (e.status !== "sent")
            return <span className="text-muted-foreground">—</span>
          return (
            <span className="flex items-center gap-2 text-muted-foreground">
              {e.openedAt && (
                <span className="flex items-center gap-1 text-xs">
                  <MailOpen className="size-3.5" /> Opened
                </span>
              )}
              {e.clickedAt && (
                <span className="flex items-center gap-1 text-xs">
                  <MousePointerClick className="size-3.5" /> Clicked
                </span>
              )}
              {!e.openedAt && !e.clickedAt && (
                <span className="text-xs">No activity</span>
              )}
            </span>
          )
        },
      },
      {
        id: "sentAt",
        accessorFn: (e) => e.sentAt ?? "",
        header: "Sent",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.sentAt ? formatDate(row.original.sentAt) : "—"}
          </span>
        ),
      },
    ],
    [contacts, leads]
  )

  const handleConnect = async (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    if (!account) return
    const res = await connectAccount(account)
    setNotice(res.message)
  }

  const handleSync = async (accountId: string) => {
    const res = await syncAccount(accountId)
    setNotice(res.message)
  }

  return (
    <>
      <PageHeader />
      <MainContentWrapper className="space-y-6 px-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Sent", value: stats.sent, icon: Mail },
            { label: "Opened", value: stats.opened, icon: MailOpen },
            { label: "Clicked", value: stats.clicked, icon: MousePointerClick },
            { label: "Drafts", value: stats.drafts, icon: Pencil },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-surface p-5"
            >
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="size-3.5" />
                {label}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {notice && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-info-soft p-3">
            <p className="text-sm text-info-strong">{notice}</p>
            <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
              Dismiss
            </Button>
          </div>
        )}

        <Tabs defaultValue="history">
          <TabsList>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-6">
            <DataTable
              columns={emailColumns}
              data={emails}
              searchPlaceholder="Search subject, recipient..."
              emptyMessage="No email history yet."
              actions={
                <Button size="sm" onClick={() => setComposeOpen(true)}>
                  <Plus />
                  Compose
                </Button>
              }
            />
          </TabsContent>

          <TabsContent value="templates" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  setEditingTemplate(null)
                  setTemplateOpen(true)
                }}
              >
                <Plus />
                New template
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {templates.map((t) => (
                <article
                  key={t.id}
                  className="flex flex-col rounded-lg border border-border bg-surface p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-foreground">{t.name}</h3>
                    <Badge variant="muted">{t.category}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.subject}
                  </p>
                  <p className="mt-2 line-clamp-3 flex-1 text-xs text-muted-foreground">
                    {stripHtml(t.body)}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(t.updatedAt)}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${t.name}`}
                        onClick={() => {
                          setEditingTemplate(t)
                          setTemplateOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${t.name}`}
                        onClick={() => setPendingDelete(t)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {accounts.map((a) => (
                <article
                  key={a.id}
                  className="rounded-lg border border-border bg-surface p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium text-foreground">
                        {a.displayName}
                      </h3>
                      <p className="truncate text-sm text-muted-foreground">
                        {a.address}
                      </p>
                    </div>
                    <Badge variant={a.connected ? "success" : "muted"}>
                      {a.connected ? (
                        <>
                          <CheckCircle2 /> Connected
                        </>
                      ) : (
                        <>
                          <Unplug /> Not connected
                        </>
                      )}
                    </Badge>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground capitalize">
                    {a.provider} · mailbox sync requires the backend
                  </p>

                  <div className="mt-4 flex gap-2 border-t border-border pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect(a.id)}
                    >
                      Connect
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSync(a.id)}
                      disabled={!a.connected}
                    >
                      <RefreshCw />
                      Sync
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </MainContentWrapper>

      <EmailComposeModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
      />

      <TemplateFormModal
        isOpen={templateOpen}
        template={editingTemplate}
        onClose={() => {
          setTemplateOpen(false)
          setEditingTemplate(null)
        }}
        onSave={(draft: TemplateDraft) => {
          if (editingTemplate) {
            dispatch(
              templateUpdated({ id: editingTemplate.id, changes: draft })
            )
          } else {
            dispatch(templateAdded(draft))
          }
          setTemplateOpen(false)
          setEditingTemplate(null)
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) dispatch(templateRemoved(pendingDelete.id))
        }}
        title="Delete template"
        description={`Delete "${pendingDelete?.name}"? This cannot be undone.`}
      />
    </>
  )
}

export default Email
