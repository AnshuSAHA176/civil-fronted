import { useEffect, useState } from 'react'
import { Building2, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { Alert } from '../../components/common/Alert'
import { getApiError } from '../../services/apiClient'
import { Button } from '../../components/common/Button'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'
import { getHodProfile, updateHodProfile } from '../../features/auth/hodProfile.api'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [success, setSuccess] = useState('')

  const loadProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getHodProfile()
      setProfile(data)
      setPhoneNumber(data?.phone_number ?? '')
    } catch (err) {
      setError(getApiError(err).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setSaveError('')
    setSuccess('')
    try {
      const { data } = await updateHodProfile({ phone_number: phoneNumber.trim() })
      setProfile(data)
      setPhoneNumber(data?.phone_number ?? phoneNumber.trim())
      setSuccess('Your profile has been updated successfully.')
    } catch (err) {
      setSaveError(getApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="profile-page" aria-busy="true">
        <div className="profile-loading"><Spinner /> <span>Loading your profile…</span></div>
      </section>
    )
  }

  if (error) {
    return <ErrorState title="Unable to load your profile" description={error} onRetry={loadProfile} />
  }

  const department = profile?.department

  return (
    <section className="profile-page">
      <header className="profile-header">
        <div>
          <p className="eyebrow">Department head</p>
          <h1>Profile</h1>
          <p>Manage your contact information and view your official department assignment.</p>
        </div>
        <div className="profile-role-badge"><ShieldCheck size={16} /> Department Head</div>
      </header>

      {saveError && <Alert tone="danger">{saveError}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <div className="profile-grid">
        <section className="profile-panel profile-identity-panel">
          <div className="profile-avatar" aria-hidden="true"><UserRound size={28} /></div>
          <h2>{profile?.email || 'Department Head'}</h2>
          <p className="profile-muted">Official CivicAI account</p>
          <div className="profile-detail-list">
            <div><Mail size={17} /><span>{profile?.email || 'Not available'}</span></div>
            <div><Phone size={17} /><span>{profile?.phone_number || 'No phone number provided'}</span></div>
          </div>
        </section>

        <section className="profile-panel">
          <div className="profile-panel-heading">
            <div className="profile-panel-icon"><Phone size={18} /></div>
            <div><h2>Contact information</h2><p>Keep the phone number associated with your official account up to date.</p></div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="hod-phone">Phone number</label>
              <input id="hod-phone" name="phone_number" type="tel" inputMode="tel" autoComplete="tel" maxLength={15} value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
            </div>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </form>
        </section>

        <section className="profile-panel profile-department-panel">
          <div className="profile-panel-heading">
            <div className="profile-panel-icon"><Building2 size={18} /></div>
            <div><h2>Department assignment</h2><p>This information is controlled by the department administration.</p></div>
          </div>
          {department ? (
            <dl className="profile-facts">
              <div><dt>Department</dt><dd>{department.name}</dd></div>
              <div><dt>Department code</dt><dd>{department.code}</dd></div>
              <div><dt>Assigned</dt><dd>{profile?.assigned_at ? new Date(profile.assigned_at).toLocaleDateString() : 'Not available'}</dd></div>
            </dl>
          ) : (
            <p className="profile-muted">No department is currently assigned to this account.</p>
          )}
        </section>
      </div>
    </section>
  )
}
