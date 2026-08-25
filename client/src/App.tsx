import { useEffect } from "react"
import Layout from "@/layout/Layout"
import { Route, Routes } from "react-router"
import AuthGuard from "@/components/common/AuthGuard"
import { useAppDispatch } from "@/store/hooks"
import { fetchMe, sessionExpired } from "@/store/authSlice"
import { fetchUsers } from "@/store/usersSlice"
import { fetchEmailTemplates } from "@/store/emailSlice"
import Login from "./pages/Login"
import {
  Dashboard,
  Contacts,
  ContactDetail,
  Companies,
  Deals,
  CompanyDetail,
  Activities,
  Leads,
  LeadDetail,
  Email,
  Documents,
  Campaigns,
  CampaignDetail,
  Automations,
  AutomationDetail,
  Tasks,
  Messages,
} from "./pages"
import Notes from "./pages/Notes"

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
                <Routes>
                  <Route path="/" element={<Dashboard />} />
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
                  <Route path="/automations" element={<Automations />} />
                  <Route path="/automations/:id" element={<AutomationDetail />} />
                </Routes>
              </Layout>
            </AuthGuard>
          }
        />
      </Routes>
    </div>
  )
}

export default App
