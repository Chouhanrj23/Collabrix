import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/routes/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import LoadingSpinner from './components/common/LoadingSpinner'
// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
// Each page is code-split into its own chunk. The browser only downloads a
// page's JS when the user first navigates to that route.
const DashboardPage     = lazy(() => import('./pages/DashboardPage'))
const MyConnectionsPage = lazy(() => import('./pages/MyConnectionsPage'))
const AddConnectionPage = lazy(() => import('./pages/AddConnectionPage'))
const FeedbackPage      = lazy(() => import('./pages/FeedbackPage'))
const EmployeesPage     = lazy(() => import('./pages/EmployeesPage'))

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner message="Loading…" />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — all routes inside share the AppLayout shell */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"      element={<DashboardPage />} />
            <Route path="/connections"    element={<MyConnectionsPage />} />
            <Route path="/add-connection" element={<AddConnectionPage />} />
            <Route path="/feedback"       element={<FeedbackPage />} />
            <Route path="/employees"      element={<EmployeesPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
