import Layout from "@/layout/Layout"
import { Route, Routes } from "react-router"
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
  return (
    <div>
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
    </div>
  )
}

export default App
