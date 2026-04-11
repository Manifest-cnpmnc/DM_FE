import { useEffect, useState } from 'react'
import RegisterPage from './pages/register'
import SignInPage from './pages/login'
import DashboardPage from './pages/dashboard'
import { getAuthToken } from './services/authService'

type AuthMode = 'register' | 'login'

function App() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [authenticated, setAuthenticated] = useState<boolean>(() => Boolean(getAuthToken()))

  useEffect(() => {
    setAuthenticated(Boolean(getAuthToken()))
  }, [])

  if (authenticated) {
    return <DashboardPage onSignOut={() => setAuthenticated(false)} />
  }

  return mode === 'register' ? (
    <RegisterPage
      onSwitch={() => setMode('login')}
      onSuccess={() => setMode('login')}
    />
  ) : (
    <SignInPage
      onSwitch={() => setMode('register')}
      onSuccess={() => setAuthenticated(true)}
    />
  )
}

export default App
