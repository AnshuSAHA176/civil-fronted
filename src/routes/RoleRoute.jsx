import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/auth.context'

export default function RoleRoute({ allowedRoles }) {
  const { role } = useAuth()
  if (!role) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}
