import { BrowserRouter, Routes, Route } from "react-router-dom"
import DashboardLayout from "./components/DashboardLayout"
import DataSetsPage from "./pages/DataSetsPage"
import OverViewPage from "./pages/OverViewPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<OverViewPage />} />
          <Route path="datasets" element={<DataSetsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
