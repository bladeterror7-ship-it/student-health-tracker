import { type FormEvent, type ReactNode, useState } from 'react'
import type { UserRole } from '../types'
import './HoverExpandLoginForm.css'

type AuthTab = 'login' | 'register'

const ROLES: { id: UserRole; label: string; icon: string }[] = [
  { id: 'student', label: 'Сурагч', icon: 'fa-solid fa-user-graduate' },
  { id: 'parent', label: 'Эцэг эх', icon: 'fa-solid fa-users' },
  { id: 'admin', label: 'Админ', icon: 'fa-solid fa-user-shield' },
]

export type HoverExpandLoginFormProps = {
  tab: AuthTab
  onTabChange: (tab: AuthTab) => void
  loginRole: UserRole
  onLoginRoleChange: (role: UserRole) => void
  loginId: string
  onLoginIdChange: (value: string) => void
  loginPassword: string
  onLoginPasswordChange: (value: string) => void
  onLoginSubmit: (e: FormEvent) => void
  submitting?: boolean
  registerContent: ReactNode
}

export default function HoverExpandLoginForm({
  tab,
  onTabChange,
  loginRole,
  onLoginRoleChange,
  loginId,
  onLoginIdChange,
  loginPassword,
  onLoginPasswordChange,
  onLoginSubmit,
  submitting = false,
  registerContent,
}: HoverExpandLoginFormProps) {
  const [touchOpen, setTouchOpen] = useState(false)

  return (
    <div className="wellbe-hover-login-main-wrapper">
      <div
        className={`wellbe-hover-login-box${touchOpen ? ' is-open' : ''}`}
        data-tab={tab}
        onClick={() => setTouchOpen(true)}
        role="presentation"
      >
        <div className="wellbe-hover-login-container">
          <div className="wellbe-hover-login-form-header">
            <h2>
              <span className="wellbe-hover-login-icon-pink">
                <i className="fa-solid fa-border-all" aria-hidden />
              </span>
              WELLBE+ НЭВТРЭХ
              <span className="wellbe-hover-login-icon-blue">
                <i className="fa-solid fa-lock" aria-hidden />
              </span>
            </h2>
          </div>

          <div className="wellbe-hover-login-expanded-content">
            <div
              className="wellbe-hover-login-tab-header"
              role="tablist"
              aria-label="Нэвтрэх эсвэл бүртгүүлэх"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'login'}
                className={`wellbe-hover-login-tab-btn${tab === 'login' ? ' active' : ''}`}
                onClick={() => onTabChange('login')}
              >
                Нэвтрэх
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'register'}
                className={`wellbe-hover-login-tab-btn${tab === 'register' ? ' active' : ''}`}
                onClick={() => onTabChange('register')}
              >
                Бүртгүүлэх
              </button>
            </div>

            {tab === 'login' ? (
              <>
                <div className="wellbe-hover-login-role-selector" role="group">
                  {ROLES.map(({ id, label, icon }) => (
                    <button
                      key={id}
                      type="button"
                      className={`wellbe-hover-login-role-btn${loginRole === id ? ' active' : ''}`}
                      onClick={() => onLoginRoleChange(id)}
                    >
                      <i className={icon} aria-hidden />
                      {label}
                    </button>
                  ))}
                </div>

                <form onSubmit={onLoginSubmit}>
                  <div className="wellbe-hover-login-input-group">
                    <label htmlFor="wellbe-login-email">И-мэйл хаяг</label>
                    <div className="wellbe-hover-login-input-wrapper">
                      <i className="fa-regular fa-envelope" aria-hidden />
                      <input
                        id="wellbe-login-email"
                        type="text"
                        required
                        value={loginId}
                        onChange={(e) => onLoginIdChange(e.target.value)}
                        placeholder="you@school.edu.mn"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="wellbe-hover-login-input-group">
                    <label htmlFor="wellbe-login-password">Нууц үг</label>
                    <div className="wellbe-hover-login-input-wrapper">
                      <i className="fa-solid fa-lock" aria-hidden />
                      <input
                        id="wellbe-login-password"
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) =>
                          onLoginPasswordChange(e.target.value)
                        }
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <p className="wellbe-hover-login-help-text">
                    Нууц үг мартсан бол сургуулийн админд хандана уу.
                  </p>

                  <button
                    type="submit"
                    className="wellbe-hover-login-btn-sign-in"
                    disabled={submitting}
                  >
                    {submitting ? 'Нэвтэрч байна…' : 'Нэвтрэх'}
                    <i className="fa-solid fa-arrow-right" aria-hidden />
                  </button>
                </form>
              </>
            ) : (
              <div className="wellbe-hover-login-register-form">
                {registerContent}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
