import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../../components/common/Alert'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { getApiError } from '../../services/apiClient'
import { citizenRegister } from '../../features/auth/auth.api'

const initialForm = {
  email: '',
  phone_number: '',
  password: '',
  confirmPassword: '',
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

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

    if (form.phone_number.length > 15) {
      nextErrors.phone_number = 'Phone number must be 15 characters or fewer.'
    }

    if (!form.password) nextErrors.password = 'Password is required.'
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.'
    else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError('')
    if (!validate()) return

    setLoading(true)
    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
        phone_number: form.phone_number.trim(),
      }

      await citizenRegister(payload)

      navigate('/login', {
        replace: true,
        state: { successMessage: 'Account created successfully. You can now sign in.' },
      })
    } catch (error) {
      setServerError(getApiError(error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <div className="auth-header">
          <p className="eyebrow">CivicAI</p>
          <h1 id="register-title">Create your account</h1>
          <p>Register as a citizen to report civic issues and track your requests.</p>
        </div>

        {serverError && <Alert tone="danger">{serverError}</Alert>}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="register-email"
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
            id="phone-number"
            name="phone_number"
            type="tel"
            label="Phone number"
            autoComplete="tel"
            value={form.phone_number}
            onChange={updateField}
            error={errors.phone_number}
            disabled={loading}
            maxLength={15}
            placeholder="Optional"
          />

          <Input
            id="register-password"
            name="password"
            type="password"
            label="Password"
            autoComplete="new-password"
            value={form.password}
            onChange={updateField}
            error={errors.password}
            disabled={loading}
            placeholder="Create a password"
          />

          <Input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            label="Confirm password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={updateField}
            error={errors.confirmPassword}
            disabled={loading}
            placeholder="Enter your password again"
          />

          <Button type="submit" loading={loading} className="auth-submit">
            Create account
          </Button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <p className="auth-footer">
          Government official? Ask your department admin to create your official account.
        </p>
      </section>
    </main>
  )
}
