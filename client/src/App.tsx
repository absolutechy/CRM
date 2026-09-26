import { Suspense, lazy, useEffect } from "react"
import { Route, Routes } from "react-router"

import Layout from "@/layout/Layout"
import AuthGuard from "@/components/common/AuthGuard"
import RoleGuard from "@/components/common/RoleGuard"
import { PageSkeleton } from "@/components/common/skeletons"
import { useAppDispatch } from "@/store/hooks"
import { fetchMe, sessionExpired } from "@/store/authSlice"
import { fetchUsers } from "@/store/usersSlice"
import { fetchEmailTemplates } from "@/store/emailSlice"

// Eager: the destination of AuthGuard's redirect, and tiny. Lazy-loading it
// would put a blank frame in front of the login form.
import Login from "./pages/Login"

// Route-level code splitting — each page becomes its own chunk, which keeps
// recharts (CampaignDetail) and TipTap (Notes) out of the initial bundle.
// These must import module paths directly: a barrel re-export would pull every
// page back into one chunk, which is why pages/index.ts no longer exists.
const Dashboard = lazy(() => import("./pages/Dashboard"))
const Review = lazy(() => import("./pages/Review"))
const Leads = lazy(() => import("./pages/Leads"))
const LeadDetail = lazy(() => import("./pages/LeadDetail"))
const Contacts = lazy(() => import("./pages/Contacts"))
const ContactDetail = lazy(() => import("./pages/ContactDetail"))
const Deals = lazy(() => import("./pages/Deals"))
const Companies = lazy(() => import("./pages/Companies"))
const CompanyDetail = lazy(() => import("./pages/CompanyDetail"))
const Activities = lazy(() => import("./pages/Activities"))
const Tasks = lazy(() => import("./pages/Tasks"))
const Notes = lazy(() => import("./pages/Notes"))
const Messages = lazy(() => import("./pages/Messages"))
const Email = lazy(() => import("./pages/Email"))
const Documents = lazy(() => import("./pages/Documents"))
const Campaigns = lazy(() => import("./pages/Campaigns"))
const CampaignDetail = lazy(() => import("./pages/CampaignDetail"))
const Automations = lazy(() => import("./pages/Automations"))
const AutomationDetail = lazy(() => import("./pages/AutomationDetail"))

const App = () => {
  const dispatch = useAppDispatch()

  // Restore the session (me → refresh on 401 → unauthenticated) once on mount.
  useEffect(() => {
    dispatch(fetchMe())
    dispatch(fetchUsers())
    dispatch(fetchEmailTemplates())

    // A failed refresh anywhere in the app ends the session.
    const onSessionExpired = () => dispatch(sessionExpired())
    window.addEventListener("auth:expired", onSessionExpired)
    return () => window.removeEventListener("auth:expired", onSessionExpired)
  }, [dispatch])

  return (
    <div>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <Layout>
                {/* One boundary, inside Layout, so the sidebar and header stay
                    mounted while a route's chunk downloads. */}
                <Suspense fallback={<PageSkeleton />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/review" element={<Review />} />
                    <Route path="/leads" element={<Leads />} />
                    <Route path="/leads/:id" element={<LeadDetail />} />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route path="/contacts/:id" element={<ContactDetail />} />
                    <Route path="/deals" element={<Deals />} />
                    <Route path="/companies" element={<Companies />} />
                    <Route path="/companies/:id" element={<CompanyDetail />} />
                    <Route path="/activities" element={<Activities />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/email" element={<Email />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/campaigns" element={<Campaigns />} />
                    <Route path="/campaigns/:id" element={<CampaignDetail />} />
                    <Route
                      path="/automations"
                      element={
                        <RoleGuard allowedRoles={["admin", "manager"]}>
                          <Automations />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="/automations/:id"
                      element={
                        <RoleGuard allowedRoles={["admin", "manager"]}>
                          <AutomationDetail />
                        </RoleGuard>
                      }
                    />
                  </Routes>
                </Suspense>
              </Layout>
            </AuthGuard>
          }
        />
      </Routes>
    </div>
  )
}

export default App
