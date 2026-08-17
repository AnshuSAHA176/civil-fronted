import { LayoutDashboard, FileText, PlusCircle, Heart, FileSearch, Bot, Bell, User } from 'lucide-react'
import AppShell from './AppShell'

const navItems = [
  { to: '/citizen/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/citizen/complaints', label: 'My Complaints', icon: FileText },
  { to: '/citizen/complaints/new', label: 'Report Issue', icon: PlusCircle },
  { to: '/citizen/liked-complaints', label: 'Liked', icon: Heart },
  { to: '/citizen/rti', label: 'RTI Requests', icon: FileSearch },
  { to: '/citizen/assistant', label: 'AI Assistant', icon: Bot },
  { to: '/citizen/notifications', label: 'Notifications', icon: Bell },
  { to: '/citizen/profile', label: 'Profile', icon: User },
]

export default function CitizenLayout() {
  return <AppShell roleLabel="Citizen" navItems={navItems} />
}
