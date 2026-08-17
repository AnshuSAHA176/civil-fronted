import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Alert } from '../../components/common/Alert'
import { getApiError } from '../../services/apiClient'
import { useAuth } from '../../features/auth/auth.context'

export default function Login() {
  const { loginCitizen, isAuthenticated, role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '')

  const destination = location.state?.from?.pathname || '/citizen/dashboard'

  useEffect(() => {
    if (isAuthenticated && role === 'citizen') navigate(destination, { replace: true })
  }, [isAuthenticated, role, navigate, destination])

  if (isAuthenticated && role !== 'citizen') {
    return <Navigate to="/unauthorized" replace />
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setServerError('')
    setSuccessMessage('')
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.'
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
      await loginCitizen({ email: form.email.trim(), password: form.password })
      navigate(destination, { replace: true })
    } catch (error) {
      setServerError(getApiError(error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-header">
          <p className="eyebrow">CivicAI</p>
          <h1 id="login-title">Welcome back</h1>
          <p>Sign in to report issues, track complaints, and manage your civic requests.</p>
        </div>

        {successMessage && <Alert tone="success">{successMessage}</Alert>}
        {serverError && <Alert tone="danger">{serverError}</Alert>}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="email"
            name="email"
            type="email"
            label="Email address"
            autoComplete="email"
            value={form.email}
            onChange={updateField}
            error={errors.email}
            disabled={loading}
            placeholder="you@example.com"
          />
          <Input
            id="password"
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
            Sign in
          </Button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
        <p className="auth-footer">
          Government official? <Link to="/official-login">Use official login</Link>
        </p>
      </section>
    </main>
  )
}
