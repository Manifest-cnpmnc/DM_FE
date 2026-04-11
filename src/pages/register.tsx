import { useState, type ChangeEvent } from 'react'
import { Shield } from 'lucide-react'
import heroImg from '../assets/hero.png'
import '../styles/register.css'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

// ─── Component ───────────────────────────────────────────────────────────────

interface AuthPageProps {
  onSwitch?: () => void
}

export default function RequestAccessPage({ onSwitch }: AuthPageProps) {
  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    // integrate later
    console.log('form submitted', form)
  }

  return (
    <div className="rap-root">
      {/* ── NAV ── */}
      <nav className="rap-nav">
        <span className="rap-nav__brand">The Archive</span>
        <div className="rap-nav__links">
          <a href="#" className="rap-nav__link">Contact Support</a>
          <a href="#" className="rap-nav__link">Security Policy</a>
          <button className="rap-nav__signin" type="button" onClick={onSwitch}>Sign In</button>
        </div>
      </nav>

      {/* ── BODY ── */}
      <div className="rap-body">
        {/* Left panel */}
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

        {/* Right form */}
        <main className="rap-main">
          <div className="rap-form">
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
                />
              </div>
            </div>

            {/* Verification notice */}
            <div className="rap-notice">
              <Shield size={17} className="rap-notice__icon" />
              <div>
                <p className="rap-notice__title">Secure and easy</p>
                <p className="rap-notice__body">
                  Your account is protected with secure authentication and fast
                  access to all features. We never share your personal data.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="rap-actions">
              <button
                className="rap-actions__primary"
                type="button"
                onClick={handleSubmit}
              >
                Create Account
              </button>
              <button
                type="button"
                className="rap-actions__link"
                onClick={onSwitch}
              >
                Already have an account? Sign In
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ── FOOTER ── */}
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