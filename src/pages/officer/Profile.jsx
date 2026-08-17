import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, BriefcaseBusiness, Building2, IdCard, RefreshCw, Save, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Alert } from '../../components/common/Alert'
import { Button } from '../../components/common/Button'
import { ErrorState } from '../../components/common/ErrorState'
import { Input } from '../../components/common/Input'
import { Spinner } from '../../components/common/Spinner'
import { getApiError } from '../../services/apiClient'
import { getOfficerProfile, updateOfficerProfile } from '../../features/auth/officerProfile.api'

const normalizeProfile = (data) => ({
  employee_id: data?.employee_id || '',
  department: data?.department ?? null,
  designation: data?.designation || '',
})

const displayDepartment = (department) => {
  if (!department) return 'Not assigned'
  if (typeof department === 'object') return department.name || department.code || department.id || 'Assigned'
  return String(department)
}

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [designation, setDesignation] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [success, setSuccess] = useState('')

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getOfficerProfile()
      const next = normalizeProfile(data)
      setProfile(next)
      setDesignation(next.designation)
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaveError(null)
    setSuccess('')
    setSaving(true)
    try {
      const { data } = await updateOfficerProfile({ designation: designation.trim() })
      const next = normalizeProfile(data)
      setProfile(next)
      setDesignation(next.designation)
      setSuccess('Your profile has been updated successfully.')
    } catch (requestError) {
      setSaveError(getApiError(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <section className="profile-page"><div className="profile-loading"><Spinner /><p>Loading your officer profile…</p></div></section>
  }

  if (error) {
    return <section className="profile-page"><ErrorState title="Unable to load your profile" description={error.message} onRetry={loadProfile} /></section>
  }

  return (
    <section className="profile-page">
      <div className="profile-header">
        <div>
          <p className="eyebrow">Officer workspace</p>
          <h1>Profile</h1>
          <p>Review your official profile information and update your designation.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/officer/dashboard')}>
          <ArrowLeft size={16} /> Dashboard
        </Button>
      </div>

      {success && <Alert tone="success">{success}</Alert>}
      {saveError && <Alert>{saveError.message}</Alert>}

      <div className="profile-grid">
        <article className="profile-card profile-identity-card">
          <div className="profile-avatar"><UserRound size={28} /></div>
          <div>
            <p className="profile-card-label">Role</p>
            <h2>Officer</h2>
            <p className="profile-muted">Official CivicAI account</p>
          </div>
          <div className="profile-security-note">
            <ShieldCheck size={17} />
            <span>Employee ID and department are controlled by the administration.</span>
          </div>
        </article>

        <article className="profile-card">
          <div className="profile-section-heading">
            <div><p className="panel-eyebrow">Account information</p><h2>Official details</h2></div>
            <BriefcaseBusiness size={19} />
          </div>

          <div className="profile-info-grid">
            <div className="profile-info-item">
              <span><IdCard size={15} /> Employee ID</span>
              <strong className="profile-id-value">{profile?.employee_id || 'Not available'}</strong>
            </div>
            <div className="profile-info-item">
              <span><Building2 size={15} /> Department</span>
              <strong>{displayDepartment(profile?.department)}</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <Input
              id="officer-designation"
              label="Designation"
              value={designation}
              onChange={(event) => setDesignation(event.target.value)}
              maxLength={200}
              placeholder="e.g. Junior Engineer"
              autoComplete="organization-title"
            />
            <div className="profile-form-actions">
              <Button type="button" variant="secondary" onClick={() => setDesignation(profile?.designation || '')} disabled={saving}>Reset</Button>
              <Button type="submit" loading={saving}>
                <Save size={16} /> Save changes
              </Button>
            </div>
          </form>
        </article>
      </div>

      <div className="profile-contract-note">
        <strong>Backend contract</strong>
        <span>The Officer profile endpoint exposes employee ID, department, and designation. Email and work-status fields are not returned by <code>/profile/</code>, so they are not fabricated in this interface.</span>
      </div>
    </section>
  )
}
