import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../features/auth/auth.context'

export default function AppShell({ roleLabel, navItems = [] }) {
  const { logout, role } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    const destination = role === 'citizen' ? '/login' : '/official-login'
    logout()
    navigate(destination, { replace: true, state: { successMessage: 'You have been signed out successfully.' } })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Civic<span>AI</span></div>
        <div className="sidebar-role">{roleLabel}</div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" className="logout-button" onClick={handleLogout} aria-label="Sign out of CivicAI"><LogOut size={17} /> Logout</button>
      </aside>
      <div className="app-main">
        <header className="topbar"><span className="mobile-brand">Civic<span>AI</span></span><span className="topbar-title">{roleLabel} Portal</span></header>
        <main className="page-content"><Outlet /></main>
        <nav className="mobile-nav" aria-label="Primary navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
