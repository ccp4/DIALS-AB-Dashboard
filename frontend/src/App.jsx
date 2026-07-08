import { BrowserRouter, Routes, Route } from "react-router-dom"
import DashboardLayout from "./components/DashboardLayout"
import DataSetsPage from "./pages/DataSetsPage"
import DataMemoryPage from "./pages/DataMemoryPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DataMemoryPage />} />
          <Route path="datasets" element={<DataSetsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
