import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/auth.context'
import { LoadingScreen } from '../components/common/LoadingScreen'

export default function ProtectedRoute() {
  const { isAuthenticated, accessToken } = useAuth()
  const location = useLocation()

  if (accessToken === undefined) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
