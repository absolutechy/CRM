import Layout from "@/layout/Layout"
import { Route, Routes } from "react-router"
import { Dashboard, Contacts, Tasks } from "./pages"

const App = () => {
  return (
    <div>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/tasks" element={<Tasks />} />
        </Routes>
      </Layout>
    </div>
  )
}

export default App
