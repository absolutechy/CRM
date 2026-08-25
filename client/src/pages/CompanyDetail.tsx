import { useEffect, useMemo } from "react"
import { ArrowLeft, Building2, FolderOpen, Globe, MapPin, Users, Wallet } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"

import MainContentWrapper from "@/components/common/MainContentWrapper"
import DataTable from "@/components/common/DataTable"
import StatCard from "@/components/pages/dashboard/StatCard"
import InteractionTimeline from "@/components/pages/activities/InteractionTimeline"
import { createContactColumns } from "@/components/pages/contacts/columns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { COMPANY_STATUS_BADGE, formatCurrency } from "@/lib/crm"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  fetchCompany,
  selectCompanyById,
  selectCompaniesStatus,
} from "@/store/companiesSlice"
import { selectContactsByCompanyId } from "@/store/contactsSlice"
import { selectDealsByCompanyId } from "@/store/dealsSlice"
import { selectTimelineForCompany } from "@/store/selectors"
import type { RootState } from "@/store"

const CompanyDetail = () => {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const company = useAppSelector((s: RootState) => selectCompanyById(s, id))
  const status = useAppSelector(selectCompaniesStatus)
  const contacts = useAppSelector((s: RootState) =>
    selectContactsByCompanyId(s, id)
  )
  const orders = useAppSelector((s: RootState) => selectDealsByCompanyId(s, id))
  const timeline = useAppSelector((s: RootState) =>
    selectTimelineForCompany(s, id)
  )

  useEffect(() => {
    if (id) {
      dispatch(fetchCompany(id))
    }
  }, [dispatch, id])

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

  if (status === "loading" && !company) {
    return (
      <MainContentWrapper className="px-8 py-16 text-center text-sm text-muted-foreground">
        Loading company…
      </MainContentWrapper>
    )
  }

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
              <StatCard
                icon={Users}
                title="Contacts"
                value={String(contacts.length)}
                subtitle="People at this account"
                tone="default"
                sparkline={[4, 5, 5, 6, 7, 7, 8, 8, 9, 10, 10]}
              />
              <StatCard
                icon={Wallet}
                title="Total deal value"
                value={formatCurrency(totalValue)}
                subtitle="All deals combined"
                tone="success"
                sparkline={[10, 12, 11, 15, 14, 18, 17, 21, 20, 24, 26]}
              />
              <StatCard
                icon={FolderOpen}
                title="Open orders"
                value={String(
                  orders.filter(
                    (o) => o.stage !== "Won" && o.stage !== "Lost"
                  ).length
                )}
                subtitle="Not yet closed"
                tone="info"
                sparkline={[3, 4, 3, 5, 4, 6, 5, 7, 6, 7, 8]}
              />
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
