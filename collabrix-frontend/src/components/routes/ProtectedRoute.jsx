import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * ProtectedRoute
 *
 * Wraps routes that require authentication.
 * Redirects to /login if the user is not authenticated.
 *
 * Usage (wrapping a layout):
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="dashboard" element={<DashboardPage />} />
 *   </Route>
 *
 * Usage (wrapping a single element):
 *   <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children ?? <Outlet />
}
