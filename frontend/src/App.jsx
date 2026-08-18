import { BrowserRouter, Routes, Route } from "react-router-dom"
import DashboardLayout from "./components/DashboardLayout"
import DataSetsPage from "./pages/DataSetsPage"
import DataMemoryPage from "./pages/DataMemoryPage"
import ErrorBoundary from "./components/ErrorBoundary"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route
            index
            element={
              <ErrorBoundary label="Memory and timings">
                <DataMemoryPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="datasets"
            element={
              <ErrorBoundary label="Data quality">
                <DataSetsPage />
              </ErrorBoundary>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
