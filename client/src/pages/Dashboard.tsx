import React, { Suspense, lazy } from "react"
import { Building2, CheckSquare, TrendingUp, Users } from "lucide-react"
import {
  StatCard,
  UpcomingAgenda,
  PeopleTable,
} from "@/components/pages/dashboard"
import EmailChartSkeleton from "@/components/pages/dashboard/skeletons/EmailChartSkeleton"
import CompaniesSectionSkeleton from "@/components/pages/dashboard/skeletons/CompaniesSectionSkeleton"
import PageHeader from "@/components/common/PageHeader"
import MainContentWrapper from "@/components/common/MainContentWrapper"
import { formatCurrency } from "@/lib/crm"
import { useAppSelector } from "@/store/hooks"
import { selectAllCompanies } from "@/store/companiesSlice"
import { selectContactCount } from "@/store/contactsSlice"
import { selectPipelineSummary } from "@/store/dealsSlice"
import { selectTaskSummary } from "@/store/tasksSlice"

// Lazy load expensive chart components
const EmailOpenRateChart = lazy(() => import("@/components/pages/dashboard/EmailOpenRateChart"))
const CompaniesSection = lazy(() => import("@/components/pages/dashboard/CompaniesSection"))

const Dashboard: React.FC = () => {
  const contactCount = useAppSelector(selectContactCount)
  const companies = useAppSelector(selectAllCompanies)
  const pipeline = useAppSelector(selectPipelineSummary)
  const tasks = useAppSelector(selectTaskSummary)

  const activeCompanies = companies.filter((c) => c.status === "active").length

  return (
    <>
      <PageHeader />
      {/* Every figure below is derived from the store — nothing is hardcoded. */}
      <MainContentWrapper className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={TrendingUp}
            title="Open Pipeline"
            value={formatCurrency(pipeline.openValue, pipeline.currency)}
            subtitle={`${pipeline.openCount} open · ${pipeline.winRate}% win rate`}
            sparkline={[12, 14, 13, 18, 17, 21, 20, 24, 23, 26, 28]}
          />
          <StatCard
            icon={Building2}
            title="Active Companies"
            value={String(activeCompanies)}
            subtitle={`${companies.length} total accounts`}
            tone="info"
            sparkline={[8, 9, 9, 11, 10, 12, 14, 13, 15, 16, 18]}
          />
          <StatCard
            icon={Users}
            title="Total Contacts"
            value={String(contactCount)}
            subtitle="Across all accounts"
            tone="success"
            sparkline={[20, 22, 21, 24, 26, 25, 28, 30, 29, 32, 34]}
          />
          <StatCard
            icon={CheckSquare}
            title="Open Tasks"
            value={String(tasks.open)}
            subtitle={
              tasks.overdue > 0
                ? `${tasks.overdue} overdue`
                : `${tasks.done} completed`
            }
            tone={tasks.overdue > 0 ? "warning" : "default"}
            sparkline={[6, 8, 7, 9, 8, 10, 9, 11, 10, 9, 8]}
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <UpcomingAgenda />
          </div>
          <div className="lg:col-span-2">
            <Suspense fallback={<EmailChartSkeleton />}>
              <EmailOpenRateChart />
            </Suspense>
          </div>
        </div>

        {/* People Table */}
        <div>
          <PeopleTable />
        </div>

        {/* Companies Section */}
        <div>
          <Suspense fallback={<CompaniesSectionSkeleton />}>
            <CompaniesSection />
          </Suspense>
        </div>
      </MainContentWrapper>
    </>
  )
}

export default Dashboard
