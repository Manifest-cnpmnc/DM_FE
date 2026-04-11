import { useState, type ChangeEvent } from 'react'
import heroImg from '../assets/hero.png'
import '../styles/register.css'
import { register } from '../services/authService'

interface FormState {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phone: string
}

interface AuthPageProps {
  onSwitch?: () => void
  onSuccess?: () => void
}

export default function RequestAccessPage({ onSwitch, onSuccess }: AuthPageProps) {
  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

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

  const handleSubmit = async () => {
    const errors: string[] = []

    if (!form.fullName.trim()) {
      errors.push('Full Name is required.')
    }
    if (!form.email.trim()) {
      errors.push('Email Address is required.')
    }
    if (!form.password) {
      errors.push('Password is required.')
    }
    if (!form.confirmPassword) {
      errors.push('Confirm Password is required.')
    }
    if (!form.phone.trim()) {
      errors.push('Phone is required.')
    }
    if (form.password && !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)) {
      errors.push('Password must be at least 8 characters and include letters and numbers.')
    }
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      errors.push('Passwords do not match.')
    }

    if (errors.length > 0) {
      showToast(errors.join(' '), 'error')
      return
    }

    setIsLoading(true)
    try {
      const response = await register(
        form.email,
        form.password,
        form.fullName,
        form.phone
      )

      if (!response.success) {
        showToast(response.message || 'Registration failed.', 'error')
        return
      }

      showToast('Account created successfully. Please sign in.', 'success')
      onSuccess?.()
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unable to create account. Please try again.'
      showToast(message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rap-root">
      <nav className="rap-nav">
        <span className="rap-nav__brand">The Archive</span>
        <div className="rap-nav__links">
          <a href="#" className="rap-nav__link">Contact Support</a>
          <a href="#" className="rap-nav__link">Security Policy</a>
          <button className="rap-nav__signin" type="button" onClick={onSwitch} disabled={isLoading}>
            Sign In
          </button>
        </div>
      </nav>

      <div className="rap-body">
        <aside className="rap-aside">
          <div className="rap-aside__overlay" />
          <div className="rap-aside__content">
            <div className="rap-aside__visual">
              <img src={heroImg} alt="Workspace overview" />
            </div>
            <p className="rap-aside__label">Create a new account</p>
            <h2 className="rap-aside__title">
              Join our community<br />and get started
            </h2>
            <p className="rap-aside__desc">
              Sign up with your email and enjoy a secure user experience.
              We keep your account protected while helping you move faster.
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
              <h1 className="rap-form__title">Create your account</h1>
              <p className="rap-form__subtitle">
                Sign up to access your dashboard and start using the platform.
              </p>
            </div>

            <div className="rap-form__grid">
              <div className="rap-field rap-field--full">
                <label className="rap-field__label">Full Name</label>
                <input
                  className="rap-field__input"
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="rap-field rap-field--full">
                <label className="rap-field__label">Email Address</label>
                <input
                  className="rap-field__input"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="rap-field rap-field--full">
                <label className="rap-field__label">Phone</label>
                <input
                  className="rap-field__input"
                  type="tel"
                  name="phone"
                  placeholder="0912345678"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="rap-field rap-field--full">
                <label className="rap-field__label">Password</label>
                <input
                  className="rap-field__input"
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <p className="rap-field__hint">
                  At least 8 characters, with letters and numbers.
                </p>
              </div>

              <div className="rap-field rap-field--full">
                <label className="rap-field__label">Confirm Password</label>
                <input
                  className="rap-field__input"
                  type="password"
                  name="confirmPassword"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="rap-notice">
              <div>
                <p className="rap-notice__title">Secure and easy</p>
                <p className="rap-notice__body">
                  Your account is protected with secure authentication and fast
                  access to all features. We never share your personal data.
                </p>
              </div>
            </div>

            <div className="rap-actions">
              <button
                className="rap-actions__primary"
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Creating account…' : 'Create Account'}
              </button>
              <button
                type="button"
                className="rap-actions__link"
                onClick={onSwitch}
                disabled={isLoading}
              >
                Already have an account? Sign In
              </button>
            </div>
          </div>
        </main>
      </div>

      <footer className="rap-footer">
        <span>© 2024 Architectural Archive. Secure Government Infrastructure.</span>
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
