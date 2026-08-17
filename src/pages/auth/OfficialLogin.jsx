import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Building2, ShieldCheck } from 'lucide-react'
import { Alert } from '../../components/common/Alert'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { getApiError } from '../../services/apiClient'
import { useAuth } from '../../features/auth/auth.context'
import { roleHome } from '../../routes/routeConfig'

export default function OfficialLogin() {
  const { loginOfficial, isAuthenticated, role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const successMessage = location.state?.successMessage || ''


  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(roleHome[role] || '/unauthorized', { replace: true })
    }
  }, [isAuthenticated, role, navigate])

  if (isAuthenticated) {
    return <Navigate to={roleHome[role] || '/unauthorized'} replace />
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setServerError('')
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (!form.password) nextErrors.password = 'Password is required.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError('')
    if (!validate()) return

    setLoading(true)
    try {
      const sessionUser = await loginOfficial({
        email: form.email.trim(),
        password: form.password,
      })

      // The backend does not return role metadata from official login.
      // loginOfficial resolves it before establishing the session.
      const detectedRole = sessionUser?.role
      const target = roleHome[detectedRole] || '/unauthorized'
      navigate(target, { replace: true })
    } catch (error) {
      const message = error instanceof Error && !error.response
        ? error.message
        : getApiError(error).message
      setServerError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card official-auth-card" aria-labelledby="official-login-title">
        <div className="auth-icon" aria-hidden="true">
          <Building2 size={22} strokeWidth={2} />
        </div>

        <div className="auth-header">
          <p className="eyebrow">CivicAI · Official Portal</p>
          <h1 id="official-login-title">Official sign in</h1>
          <p>Access the CivicAI workspace for authorized government staff.</p>
        </div>

        <div className="auth-trust-note">
          <ShieldCheck size={17} aria-hidden="true" />
          <span>Role-based access is enforced by the backend.</span>
        </div>

        {successMessage && <Alert tone="success">{successMessage}</Alert>}
        {serverError && <Alert tone="danger">{serverError}</Alert>}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="official-email"
            name="email"
            type="email"
            label="Official email address"
            autoComplete="username"
            value={form.email}
            onChange={updateField}
            error={errors.email}
            disabled={loading}
            placeholder="name@department.gov"
          />

          <Input
            id="official-password"
            name="password"
            type="password"
            label="Password"
            autoComplete="current-password"
            value={form.password}
            onChange={updateField}
            error={errors.password}
            disabled={loading}
            placeholder="Enter your password"
          />

          <Button type="submit" loading={loading} className="auth-submit">
            Sign in to official portal
          </Button>
        </form>

        <p className="auth-footer">
          Citizen account? <Link to="/login">Use citizen login</Link>
        </p>
        <p className="auth-footer">
          Need an official account? Ask your department admin to create one for you.
        </p>
      </section>
    </main>
  )
}
