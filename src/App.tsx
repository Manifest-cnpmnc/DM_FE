import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import RegisterPage from './pages/register'
import SignInPage from './pages/login'
import Layout from './components/Layout'
import DocumentsPage from './pages/documents'
import DocumentDetailPage from './pages/documentDetail'
import CategoriesPage from './pages/categories'
import UsersPage from './pages/users'
import ProfilePage from './pages/profile'
import NotificationsPage from './pages/notifications'
import AuditLogsPage from './pages/auditLogs'
import { getAuthToken } from './services/authService'
import CatePage from './pages/categoriesManagement.tsx'

type AuthMode = 'register' | 'login'

function App() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [authenticated, setAuthenticated] = useState<boolean>(() => Boolean(getAuthToken()))

  if (!authenticated) {
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

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onSignOut={() => setAuthenticated(false)} />}>
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="*" element={<Navigate to="/documents" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
