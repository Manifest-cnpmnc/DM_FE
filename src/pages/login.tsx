import { useState, type ChangeEvent } from 'react'
import heroImg from '../assets/hero.png'
import '../styles/register.css'

interface LoginFormState {
  email: string
  password: string
}

interface AuthPageProps {
  onSwitch?: () => void
}

export default function SignInPage({ onSwitch }: AuthPageProps) {
  const [form, setForm] = useState<LoginFormState>({
    email: '',
    password: '',
  })
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 4200)
  }

  const handleSubmit = () => {
    const errors: string[] = []

    if (!form.email.trim()) {
      errors.push('Email Address is required.')
    }
    if (!form.password) {
      errors.push('Password is required.')
    }
    if (form.password && form.password.length < 8) {
      errors.push('Password must be at least 8 characters.')
    }

    if (errors.length > 0) {
      showToast(errors.join(' '), 'error')
      return
    }

    showToast('Signed in successfully.', 'success')
    console.log('sign in', form)
  }

  return (
    <div className="rap-root">
      <nav className="rap-nav">
        <span className="rap-nav__brand">The Archive</span>
        <div className="rap-nav__links">
          <a href="#" className="rap-nav__link">Contact Support</a>
          <a href="#" className="rap-nav__link">Security Policy</a>
          <button className="rap-nav__signin" type="button" onClick={onSwitch}>Create Account</button>
        </div>
      </nav>

      <div className="rap-body">
        <aside className="rap-aside">
          <div className="rap-aside__overlay" />
          <div className="rap-aside__content">
            <div className="rap-aside__visual">
              <img src={heroImg} alt="Workspace overview" />
            </div>
            <p className="rap-aside__label">Welcome back</p>
            <h2 className="rap-aside__title">
              Sign in to continue<br />and manage your documents
            </h2>
            <p className="rap-aside__desc">
              Use your existing account to access secure government features and file management.
            </p>
          </div>
        </aside>

        <main className="rap-main">
          <div className="rap-form">
            {toast ? (
              <div className={`rap-toast rap-toast--${toast.type}`}>
                {toast.message}
              </div>
            ) : null}
            <div className="rap-form__header">
              <h1 className="rap-form__title">Sign In</h1>
              <p className="rap-form__subtitle">
                Enter your credentials to open your dashboard.
              </p>
            </div>

            <div className="rap-form__grid">
              <div className="rap-field rap-field--full">
                <label className="rap-field__label">Email Address</label>
                <input
                  className="rap-field__input"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="rap-field rap-field--full">
                <label className="rap-field__label">Password</label>
                <input
                  className="rap-field__input"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                />
                <p className="rap-field__hint">
                  Password must be at least 8 characters.
                </p>
              </div>
            </div>

            <div className="rap-notice">
              <div>
                <p className="rap-notice__title">Secure access</p>
                <p className="rap-notice__body">
                  Your login is protected with modern authentication and secure session handling.
                </p>
              </div>
            </div>

            <div className="rap-actions">
              <button
                className="rap-actions__primary"
                type="button"
                onClick={handleSubmit}
              >
                Sign In
              </button>
              <button
                type="button"
                className="rap-actions__link"
                onClick={onSwitch}
              >
                Don't have an account? Register
              </button>
            </div>
          </div>
        </main>
      </div>

      <footer className="rap-footer">
        <span>� 2024 Architectural Archive. Secure Government Infrastructure.</span>
        <div className="rap-footer__links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Accessibility</a>
          <a href="#">Department Portal</a>
        </div>
      </footer>
    </div>
  )
}
