import { getAuthUser, logout } from '../services/authService'

interface DashboardProps {
  onSignOut: () => void
}

export default function DashboardPage({ onSignOut }: DashboardProps) {
  const user = getAuthUser()

  return (
    <div className="rap-root">
      <nav className="rap-nav">
        <span className="rap-nav__brand">The Archive</span>
        <button className="rap-nav__signin" type="button" onClick={() => {
          logout()
          onSignOut()
        }}>
          Sign Out
        </button>
      </nav>

      <main className="rap-main" style={{ padding: '64px 40px' }}>
        <div className="rap-form" style={{ maxWidth: '720px' }}>
          <div className="rap-form__header">
            <h1 className="rap-form__title">Welcome back</h1>
            <p className="rap-form__subtitle">
              You are signed in. Manage your documents and access secure features.
            </p>
          </div>
          <div className="rap-field">
            <p className="rap-field__label">Name</p>
            <p>{user?.fullName ?? 'Unknown user'}</p>
          </div>
          <div className="rap-field">
            <p className="rap-field__label">Email</p>
            <p>{user?.email ?? 'Unknown email'}</p>
          </div>
          <div className="rap-field">
            <p className="rap-field__label">Role</p>
            <p>{user?.role ?? 'Unknown role'}</p>
          </div>
        </div>
      </main>
    </div>
  )
}
