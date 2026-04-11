import { useState, type ChangeEvent } from 'react'
import { Lock } from 'lucide-react'
import heroImg from '../assets/hero.png'
import '../styles/register.css'

interface AuthPageProps {
  onSwitch?: () => void
}

interface LoginFormState {
  email: string
  password: string
  remember: boolean
}

export default function SignInPage({ onSwitch }: AuthPageProps) {
  const [form, setForm] = useState<LoginFormState>({
    email: '',
    password: '',
    remember: false,
  })

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = () => {
    console.log('login submitted', form)
  }

  return (
    <div className="rap-root">
      <nav className="rap-nav">
        <span className="rap-nav__brand">The Archive</span>
        <div className="rap-nav__links">
          <a href="#" className="rap-nav__link">Contact Support</a>
          <a href="#" className="rap-nav__link">Security Policy</a>
          <button className="rap-nav__signin" type="button" onClick={onSwitch}>Register</button>
        </div>
      </nav>

      <div className="rap-body">
        <main className="rap-main">
          <div className="rap-form">
            <div className="rap-form__header">
              <h1 className="rap-form__title">Sign In</h1>
              <p className="rap-form__subtitle">
                Enter your official credentials to continue.
              </p>
            </div>

            <div className="rap-form__grid">
              <div className="rap-field rap-field--full">
                <label className="rap-field__label">Official Email</label>
                <input
                  className="rap-field__input"
                  type="email"
                  name="email"
                  placeholder="j.doe@dept.gov"
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
                  placeholder="••••••••••••••"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              <div className="rap-checkbox">
                <input
                  id="remember"
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                />
                <label className="rap-checkbox__label" htmlFor="remember">
                  Remember me
                </label>
              </div>
            </div>

            <div className="rap-notice">
              <Lock size={17} className="rap-notice__icon" />
              <div>
                <p className="rap-notice__title">Encrypted Session</p>
                <p className="rap-notice__body">
                  Your login request is protected with advanced encryption and monitored by the security operations center.
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
                Need access? Request Account
              </button>
            </div>
          </div>
        </main>

        <aside className="rap-aside">
          <div className="rap-aside__overlay" />
          <div className="rap-aside__content">
            <div className="rap-aside__visual">
              <img src={heroImg} alt="Secure archival access" />
            </div>
            <p className="rap-aside__label">Secure Access Portal</p>
            <h2 className="rap-aside__title">
              Welcome Back<br />Authorized Personnel
            </h2>
            <p className="rap-aside__desc">
              Sign in to continue your review and access the secure archival network. Only verified users may proceed.
            </p>
          </div>
        </aside>
      </div>

      <footer className="rap-footer">
        <span>© 2026 Architectural Archive. Secure Government Infrastructure.</span>
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
