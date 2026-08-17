import { LayoutDashboard, FileText, FileSearch, Bell, User } from 'lucide-react'
import AppShell from './AppShell'

const navItems = [
  { to: '/officer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/officer/complaints', label: 'Complaints', icon: FileText },
  { to: '/officer/rti', label: 'RTI Requests', icon: FileSearch },
  { to: '/officer/notifications', label: 'Notifications', icon: Bell },
  { to: '/officer/profile', label: 'Profile', icon: User },
]

export default function OfficerLayout() {
  return <AppShell roleLabel="Officer" navItems={navItems} />
}
