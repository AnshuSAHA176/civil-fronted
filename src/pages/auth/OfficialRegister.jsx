import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, ShieldAlert } from 'lucide-react'
import { Alert } from '../../components/common/Alert'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { getApiError } from '../../services/apiClient'
import { officialRegister } from '../../features/auth/auth.api'

const ROLE_OPTIONS = [
  { value: 'officer', label: 'Officer' },
  { value: 'department_head', label: 'Department Head' },
  { value: 'admin', label: 'Admin' },
  { value: 'auditor', label: 'Auditor' },
]

const initialForm = {
  email: '',
  phone_number: '',
  password: '',
  confirmPassword: '',
  role: 'officer',
}

export default function OfficialRegister() {
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

    if (!form.role) nextErrors.role = 'Select an official role.'

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
      await officialRegister({
        email: form.email.trim(),
        password: form.password,
        phone_number: form.phone_number.trim(),
        role: form.role,
      })

      navigate('/official-login', {
        replace: true,
        state: {
          successMessage: 'Official account created successfully. You can now sign in.',
        },
      })
    } catch (error) {
      setServerError(getApiError(error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card official-auth-card" aria-labelledby="official-register-title">
        <div className="auth-icon" aria-hidden="true">
          <Building2 size={22} strokeWidth={2} />
        </div>

        <div className="auth-header">
          <p className="eyebrow">CivicAI · Official Portal</p>
          <h1 id="official-register-title">Create official account</h1>
          <p>Register an authorized staff account using the roles currently exposed by the backend.</p>
        </div>

        <div className="auth-security-warning" role="note">
          <ShieldAlert size={17} aria-hidden="true" />
          <span>
            This endpoint requires an existing admin account to be signed in. If you are not signed in as an admin, submitting this form will return a permission error — contact your CivicAI administrator to have your official account created.
          </span>
        </div>

        {serverError && <Alert tone="danger">{serverError}</Alert>}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="official-register-email"
            name="email"
            type="email"
            label="Official email address"
            autoComplete="email"
            value={form.email}
            onChange={updateField}
            error={errors.email}
            disabled={loading}
            placeholder="name@department.gov"
          />

          <Input
            id="official-register-phone"
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

          <div className="field">
            <label htmlFor="official-register-role">Official role</label>
            <select
              id="official-register-role"
              name="role"
              value={form.role}
              onChange={updateField}
              disabled={loading}
              aria-invalid={Boolean(errors.role)}
              aria-describedby={errors.role ? 'official-register-role-error' : undefined}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.role && <p id="official-register-role-error" className="field-error">{errors.role}</p>}
          </div>

          <Input
            id="official-register-password"
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
            id="official-register-confirm-password"
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
            Create official account
          </Button>
        </form>

        <p className="auth-footer">
          Already have an official account? <Link to="/official-login">Sign in</Link>
        </p>
        <p className="auth-footer">
          Citizen account? <Link to="/register">Use citizen registration</Link>
        </p>
      </section>
    </main>
  )
}
