import { BrowserRouter, Routes, Route } from "react-router-dom"
import DashboardLayout from "./components/DashboardLayout"
import DataSetsPage from "./pages/DataSetsPage"
import DataMemoryPage from "./pages/DataMemoryPage"
import ExplorePage from "./pages/ExplorePage"
import DatasetDetailPage from "./pages/DatasetDetailPage"
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
          <Route
            path="explore"
            element={
              <ErrorBoundary label="Explore">
                <ExplorePage />
              </ErrorBoundary>
            }
          />
          <Route
            path="explore/dataset/:run/*"
            element={
              <ErrorBoundary label="Dataset detail">
                <DatasetDetailPage />
              </ErrorBoundary>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
