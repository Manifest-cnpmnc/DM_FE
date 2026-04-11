import { useState } from 'react'
import RequestAccessPage from './pages/register'
import SignInPage from './pages/login'

type AuthMode = 'register' | 'login'

function App() {
  const [mode, setMode] = useState<AuthMode>('register')

  return mode === 'register' ? (
    <RequestAccessPage onSwitch={() => setMode('login')} />
  ) : (
    <SignInPage onSwitch={() => setMode('register')} />
  )
}

export default App
