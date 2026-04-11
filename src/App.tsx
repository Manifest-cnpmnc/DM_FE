import { useEffect, useState } from 'react'
import RegisterPage from './pages/register'
import SignInPage from './pages/login'
import FileListPage from './pages/fileList'
import UploadPage from './pages/UploadPage'
import { getAuthToken } from './services/authService'

type AuthMode = 'register' | 'login'
type AppView = 'list' | 'upload'

function App() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [view, setView] = useState<AppView>('list')
  const [authenticated, setAuthenticated] = useState<boolean>(() => Boolean(getAuthToken()))

  useEffect(() => {
    setAuthenticated(Boolean(getAuthToken()))
  }, [])

  if (authenticated) {
    if (view === 'upload') {
      return (
        <UploadPage
          onBack={() => setView('list')}
          onSuccess={() => setView('list')}
        />
      )
    }
    return (
      <FileListPage
        onSignOut={() => setAuthenticated(false)}
        onUpload={() => setView('upload')}
      />
    )
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
