import { LayoutDashboard, FileText, Users, BarChart3, Building2, Bell, User } from 'lucide-react'
import AppShell from './AppShell'

const navItems = [
  { to: '/hod/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/hod/complaints', label: 'Complaints', icon: FileText },
  { to: '/hod/officers', label: 'Officers', icon: Users },
  { to: '/hod/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/hod/department', label: 'Department', icon: Building2 },
  { to: '/hod/notifications', label: 'Notifications', icon: Bell },
  { to: '/hod/profile', label: 'Profile', icon: User },
]

export default function HodLayout() {
  return <AppShell roleLabel="Department Head" navItems={navItems} />
}
