import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout, getAuthUser } from '../services/authService'
import { FileText, FolderOpen, Users, Bell, ClipboardList, User, LogOut, Building2 } from 'lucide-react'

interface LayoutProps {
  onSignOut: () => void
}

export default function Layout({ onSignOut }: LayoutProps) {
  const navigate = useNavigate()
  const user = getAuthUser()
  const isAdmin = user?.role === 'ADMIN'

  const handleSignOut = () => {
    logout()
    onSignOut()
    navigate('/')
  }

  const links = [
    { to: '/documents', label: 'My Documents', icon: FileText },
    { to: '/organizations', label: 'Organizations', icon: Building2 },
    { to: '/categories', label: 'Categories', icon: FolderOpen },
    ...(isAdmin ? [{ to: '/users', label: 'Users', icon: Users }] : []),
    { to: '/notifications', label: 'Notifications', icon: Bell },
    ...(isAdmin ? [{ to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList }] : []),
    { to: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-sidebar__brand">The Archive</div>
        <nav className="app-sidebar__nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `app-sidebar__link ${isActive ? 'app-sidebar__link--active' : ''}`
              }
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-sidebar__footer">
          <div className="app-sidebar__user">
            <span className="app-sidebar__user-name">{user?.fullName ?? 'User'}</span>
            <span className="app-sidebar__user-role">{user?.role ?? ''}</span>
          </div>
          <button type="button" className="app-sidebar__logout" onClick={handleSignOut}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}
