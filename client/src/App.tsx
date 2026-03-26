import Layout from "@/layout/Layout"
import { Route, Routes } from "react-router"
import { Dashboard } from "./pages"

const App = () => {
  return (
    <div>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Layout>
    </div>
  )
}

export default App
