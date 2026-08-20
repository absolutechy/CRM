import { useMemo } from "react"
import { ArrowLeft, Building2, Globe, MapPin, Users } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import DataTable from "@/components/common/DataTable"
import InteractionTimeline from "@/components/pages/activities/InteractionTimeline"
import { createContactColumns } from "@/components/pages/contacts/columns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { COMPANY_STATUS_BADGE, formatCurrency } from "@/lib/crm"
import { useAppSelector } from "@/store/hooks"
import { selectCompanyById } from "@/store/companiesSlice"
import { selectContactsByCompanyId } from "@/store/contactsSlice"
import { selectDealsByCompanyId } from "@/store/dealsSlice"
import { selectTimelineForCompany } from "@/store/selectors"
import type { RootState } from "@/store"

const CompanyDetail = () => {
  const { id = "" } = useParams()
  const navigate = useNavigate()

  const company = useAppSelector((s: RootState) => selectCompanyById(s, id))
  const contacts = useAppSelector((s: RootState) =>
    selectContactsByCompanyId(s, id)
  )
  const orders = useAppSelector((s: RootState) => selectDealsByCompanyId(s, id))
  const timeline = useAppSelector((s: RootState) =>
    selectTimelineForCompany(s, id)
  )

  const columns = useMemo(
    () =>
      createContactColumns({
        companyName: () => company?.name ?? "—",
        onEdit: (contact) => navigate(`/contacts/${contact.id}`),
        onDelete: (contact) => navigate(`/contacts/${contact.id}`),
      }),
    [company?.name, navigate]
  )

  const totalValue = orders.reduce((sum, o) => sum + o.amount, 0)

  if (!company) {
    return (
      <MainContentWrapper className="px-8 py-16">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Company not found
          </h2>
          <Button asChild variant="outline">
            <Link to="/companies">
              <ArrowLeft />
              Back to companies
            </Link>
          </Button>
        </div>
      </MainContentWrapper>
    )
  }

  return (
    <>
      <div className="border-b border-border bg-surface">
        <div className="flex flex-col gap-4 px-8 py-5 sm:flex-row sm:items-center">
          <Button asChild variant="ghost" size="icon-sm" className="self-start">
            <Link to="/companies" aria-label="Back to companies">
              <ArrowLeft />
            </Link>
          </Button>

          <span className="flex size-14 items-center justify-center rounded-lg bg-primary-100">
            <Building2 className="size-7 text-primary-700" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {company.name}
              </h1>
              <Badge variant={COMPANY_STATUS_BADGE[company.status]}>
                {company.status}
              </Badge>
            </div>
            <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
              <span>{company.industry}</span>
              {company.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {company.location}
                </span>
              )}
              {company.website && (
                <a
                  href={`https://${company.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-primary hover:underline"
                >
                  <Globe className="size-3.5" />
                  {company.website}
                </a>
              )}
            </p>
          </div>
        </div>
      </div>

      <MainContentWrapper className="space-y-6 px-8">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-surface p-5">
                <p className="text-xs text-muted-foreground">Contacts</p>
                <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-foreground">
                  <Users className="size-5 text-primary-700" />
                  {contacts.length}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-5">
                <p className="text-xs text-muted-foreground">Total deal value</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-5">
                <p className="text-xs text-muted-foreground">Open orders</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {
                    orders.filter(
                      (o) => o.stage !== "Won" && o.stage !== "Lost"
                    ).length
                  }
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="people" className="mt-6">
            <DataTable
              columns={columns}
              data={contacts}
              searchPlaceholder="Search people..."
              onRowClick={(contact) => navigate(`/contacts/${contact.id}`)}
              emptyMessage="No contacts linked to this company yet."
              initialPageSize={10}
            />
          </TabsContent>

          {/* Account rollup — interactions across every contact at this company */}
          <TabsContent value="activity" className="mt-6">
            <InteractionTimeline
              entries={timeline}
              showContact
              title={`Interactions across ${company.name}`}
            />
          </TabsContent>
        </Tabs>
      </MainContentWrapper>
    </>
  )
}

export default CompanyDetail
