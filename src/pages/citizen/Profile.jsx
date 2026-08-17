import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Camera, CheckCircle2, Save, UserRound } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Textarea } from '../../components/common/Textarea'
import { Alert } from '../../components/common/Alert'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'
import { Badge } from '../../components/common/Badge'
import { useAuth } from '../../features/auth/auth.context'
import { getCitizenProfile, updateCitizenProfile } from '../../features/auth/profile.api'
import { getApiError } from '../../services/apiClient'

const emptyForm = {
  full_name: '',
  address: '',
  city: '',
  district: '',
  state: '',
  pincode: '',
  profile_picture: null,
}

const imageUrl = (value) => {
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
  return `${base}/${String(value).replace(/^\//, '')}`
}

const normalizeProfile = (data) => ({
  full_name: data?.full_name || '',
  address: data?.address || '',
  city: data?.city || '',
  district: data?.district || '',
  state: data?.state || '',
  pincode: data?.pincode ?? '',
  profile_picture: null,
})

export default function Profile() {
  const { role } = useAuth()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [success, setSuccess] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getCitizenProfile()
      setForm(normalizeProfile(response.data))
      setPreviewUrl(imageUrl(response.data?.profile_picture))
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const displayName = useMemo(() => {
    return form.full_name.trim() || 'Citizen'
  }, [form.full_name])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setSaveError(null)
    setSuccess('')
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setSaveError({ message: 'Please select a valid image file.' })
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveError({ message: 'Profile pictures must be 5 MB or smaller.' })
      event.target.value = ''
      return
    }

    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    const nextPreview = URL.createObjectURL(file)
    setPreviewUrl(nextPreview)
    updateField('profile_picture', file)
  }

  const validate = () => {
    const pincode = String(form.pincode).trim()
    if (pincode && !/^\d+$/.test(pincode)) {
      return 'Pincode must contain digits only.'
    }
    if (pincode && (pincode.length < 4 || pincode.length > 10)) {
      return 'Please enter a valid pincode.'
    }
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaveError(null)
    setSuccess('')

    const validationError = validate()
    if (validationError) {
      setSaveError({ message: validationError })
      return
    }

    setSaving(true)
    try {
      const response = await updateCitizenProfile(form)
      setForm(normalizeProfile(response.data))
      if (response.data?.profile_picture) {
        setPreviewUrl(imageUrl(response.data.profile_picture))
      }
      setSuccess('Your profile has been updated successfully.')
    } catch (requestError) {
      setSaveError(getApiError(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="page-section profile-page" aria-busy="true">
        <div className="page-heading">
          <p className="eyebrow">Account</p>
          <h1>Profile</h1>
          <p>Manage the information associated with your CivicAI citizen profile.</p>
        </div>
        <div className="page-loading"><Spinner /><span>Loading your profile…</span></div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page-section profile-page">
        <div className="page-heading">
          <p className="eyebrow">Account</p>
          <h1>Profile</h1>
          <p>Manage the information associated with your CivicAI citizen profile.</p>
        </div>
        <ErrorState title="Unable to load your profile" description={error.message} onRetry={loadProfile} />
      </section>
    )
  }

  return (
    <section className="page-section profile-page">
      <div className="page-heading">
        <p className="eyebrow">Account</p>
        <h1>Profile</h1>
        <p>Manage the information associated with your CivicAI citizen profile.</p>
      </div>

      <form className="profile-grid" onSubmit={handleSubmit}>
        <aside className="profile-summary dashboard-panel">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {previewUrl ? (
                <img src={previewUrl} alt={`${displayName} profile`} />
              ) : (
                <UserRound size={42} aria-hidden="true" />
              )}
            </div>
            <button
              type="button"
              className="profile-avatar-action"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile picture"
            >
              <Camera size={16} aria-hidden="true" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />

          <h2>{displayName}</h2>
          <p>Citizen account</p>
          <Badge variant="info">{role || 'citizen'}</Badge>

          <p className="profile-summary-note">
            Your profile endpoint currently exposes citizen profile information only.
          </p>
        </aside>

        <div className="profile-form dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Personal information</p>
              <h2>Profile details</h2>
            </div>
          </div>

          {success && (
            <Alert tone="success">
              <CheckCircle2 size={16} aria-hidden="true" />
              {success}
            </Alert>
          )}

          {saveError && (
            <Alert tone="danger">
              {saveError.message}
            </Alert>
          )}

          <div className="form-grid two-columns">
            <Input
              id="profile-full-name"
              label="Full name"
              value={form.full_name}
              onChange={(event) => updateField('full_name', event.target.value)}
              maxLength={100}
              autoComplete="name"
            />

            <Input
              id="profile-pincode"
              label="Pincode"
              value={form.pincode}
              onChange={(event) => updateField('pincode', event.target.value)}
              inputMode="numeric"
              autoComplete="postal-code"
            />

            <Input
              id="profile-city"
              label="City"
              value={form.city}
              onChange={(event) => updateField('city', event.target.value)}
              maxLength={100}
              autoComplete="address-level2"
            />

            <Input
              id="profile-district"
              label="District"
              value={form.district}
              onChange={(event) => updateField('district', event.target.value)}
              maxLength={100}
            />

            <Input
              id="profile-state"
              label="State"
              value={form.state}
              onChange={(event) => updateField('state', event.target.value)}
              maxLength={100}
              autoComplete="address-level1"
            />

            <div className="profile-file-note">
              <strong>Profile picture</strong>
              <span>JPEG, PNG, or another supported image format. Maximum 5 MB.</span>
            </div>
          </div>

          <Textarea
            id="profile-address"
            label="Address"
            value={form.address}
            onChange={(event) => updateField('address', event.target.value)}
            rows={4}
            autoComplete="street-address"
          />

          <div className="profile-form-footer">
            <p>
              Email address and phone number are not returned by the current citizen profile endpoint,
              so they are not presented as editable profile fields here.
            </p>
            <Button type="submit" disabled={saving}>
              <Save size={16} aria-hidden="true" />
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </form>
    </section>
  )
}
