import React, { Suspense, lazy } from "react"
import { Mail, Building2, Users, CheckSquare } from "lucide-react"
import {
  StatCard,
  UpcomingAgenda,
  PeopleTable,
} from "@/components/pages/dashboard"
import EmailChartSkeleton from "@/components/pages/dashboard/skeletons/EmailChartSkeleton"
import CompaniesSectionSkeleton from "@/components/pages/dashboard/skeletons/CompaniesSectionSkeleton"
import PageHeader from "@/components/common/PageHeader"
import MainContentWrapper from "@/components/common/MainContentWrapper"

// Lazy load expensive chart components
const EmailOpenRateChart = lazy(() => import("@/components/pages/dashboard/EmailOpenRateChart"))
const CompaniesSection = lazy(() => import("@/components/pages/dashboard/CompaniesSection"))

const Dashboard: React.FC = () => {
  return (
    <>
      <PageHeader />
      {/* Stats Row */}
      <MainContentWrapper className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Mail}
            title="Email Sent"
            value="1,251"
            subtitle="Mail"
          />
          <StatCard
            icon={Building2}
            title="Active Company"
            value="43"
            subtitle="Company"
          />
          <StatCard
            icon={Users}
            title="Total Contact"
            value="162"
            subtitle="Contact"
          />
          <StatCard
            icon={CheckSquare}
            title="Ongoing Task"
            value="5"
            subtitle="Task"
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
