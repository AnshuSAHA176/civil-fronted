import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, ChevronRight, FileText, MapPin, RefreshCw, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { getOfficerComplaintDetails, updateOfficerComplaint } from '../../features/officer/complaints.api'
import { formatConfidence, formatDateTime, formatPriority, formatStatus, mediaUrl, STATUS_TONES, PRIORITY_TONES } from '../../features/complaints/complaints.utils'
import { getApiError } from '../../services/apiClient'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'
import { Input } from '../../components/common/Input'
import { Textarea } from '../../components/common/Textarea'
import { Alert } from '../../components/common/Alert'
import { COMPLAINT_STATUSES } from '../../utils/constants'

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{value || 'Not available'}</dd>
    </div>
  )
}

function Timeline({ complaint }) {
  const events = [
    ['Reported', complaint?.reported_at || complaint?.created_at],
    ['Assigned', complaint?.assigned_at],
    ['Accepted', complaint?.accepted_at],
    ['Expected resolution', complaint?.expected_resolution_date],
    ['Resolved', complaint?.resolved_at],
    ['Closed', complaint?.closed_at],
  ].filter(([, value]) => value)

  if (!events.length) return <p className="muted-copy">No lifecycle timestamps are available.</p>

  return (
    <ol className="complaint-timeline" aria-label="Complaint lifecycle">
      {events.map(([label, value]) => (
        <li key={`${label}-${value}`} className="complaint-timeline-item">
          <span className="complaint-timeline-dot" aria-hidden="true" />
          <div>
            <strong>{label}</strong>
            <time dateTime={value}>{formatDateTime(value)}</time>
          </div>
        </li>
      ))}
    </ol>
  )
}

function toDateTimeLocal(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function OfficerComplaintDetails() {
  const { complaintId } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState(null)
  const [updateSuccess, setUpdateSuccess] = useState('')
  const [status, setStatus] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [expectedResolutionDate, setExpectedResolutionDate] = useState('')

  const loadComplaint = useCallback(async () => {
    if (!complaintId) return
    setLoading(true)
    setError(null)
    try {
      const response = await getOfficerComplaintDetails(complaintId)
      setComplaint(response.data)
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [complaintId])

  useEffect(() => { loadComplaint() }, [loadComplaint])

  useEffect(() => {
    if (!complaint) return
    setStatus(complaint.status || '')
    setResolutionNotes(complaint.resolution_notes || '')
    setExpectedResolutionDate(complaint.expected_resolution_date ? toDateTimeLocal(complaint.expected_resolution_date) : '')
    setUpdateError(null)
    setUpdateSuccess('')
  }, [complaint])

  const statusOptions = useMemo(() => COMPLAINT_STATUSES, [])

  const submitUpdate = async (event) => {
    event.preventDefault()
    if (!complaintId || !status) return

    setUpdateLoading(true)
    setUpdateError(null)
    setUpdateSuccess('')

    const payload = {
      status,
      resolution_notes: resolutionNotes.trim(),
    }

    if (expectedResolutionDate) {
      payload.expected_resolution_date = new Date(expectedResolutionDate).toISOString()
    } else {
      payload.expected_resolution_date = null
    }

    try {
      const response = await updateOfficerComplaint(complaintId, payload)
      setComplaint(response.data)
      setUpdateSuccess('Complaint workflow information updated successfully.')
    } catch (requestError) {
      setUpdateError(getApiError(requestError))
    } finally {
      setUpdateLoading(false)
    }
  }

  if (loading) return <div className="detail-loading"><Spinner /><span>Loading complaint details…</span></div>

  if (error || !complaint) {
    return (
      <section className="detail-page officer-detail-page">
        <Button variant="ghost" onClick={() => navigate('/officer/complaints')}><ArrowLeft size={16} /> Back to assigned complaints</Button>
        <ErrorState title="Unable to load this complaint" description={error?.message || 'The complaint details are unavailable.'} onRetry={loadComplaint} />
      </section>
    )
  }

  const currentStatus = complaint.status || 'pending'
  const priority = complaint.priority || ''
  const images = Array.isArray(complaint.images) ? complaint.images : []

  return (
    <section className="detail-page officer-detail-page">
      <header className="detail-header">
        <div>
          <Button variant="ghost" onClick={() => navigate('/officer/complaints')}><ArrowLeft size={16} /> Back to assigned complaints</Button>
          <p className="eyebrow">Officer workspace</p>
          <p className="complaint-id">#{complaint.complaint_id || 'ID unavailable'}</p>
          <h1>{complaint.title || 'Untitled complaint'}</h1>
          <div className="detail-badges">
            <Badge tone={STATUS_TONES[currentStatus] || 'neutral'}>{formatStatus(currentStatus)}</Badge>
            {priority && <Badge tone={PRIORITY_TONES[priority] || 'neutral'}>{formatPriority(priority)} priority</Badge>}
          </div>
        </div>
        <div className="detail-header-actions">
          <Button variant="secondary" onClick={() => navigate(`/officer/complaints/${encodeURIComponent(complaintId)}/history`)}>History</Button>
          <Button variant="secondary" onClick={loadComplaint}><RefreshCw size={16} /> Refresh</Button>
        </div>
      </header>

      <div className="detail-layout">
        <main className="detail-main">
          <section className="detail-panel">
            <div className="panel-heading"><div><p className="panel-eyebrow">Issue</p><h2>Description</h2></div><FileText size={19} /></div>
            <p className="detail-description">{complaint.description || 'No description provided.'}</p>
          </section>

          <section className="detail-panel">
            <div className="panel-heading"><div><p className="panel-eyebrow">CivicAI analysis</p><h2>Classification</h2></div><ShieldCheck size={19} /></div>
            <dl className="detail-grid">
              <DetailRow label="Category" value={complaint.category ? formatPriority(complaint.category) : null} />
              <DetailRow label="AI confidence" value={formatConfidence(complaint.ai_confidence)} />
              <DetailRow label="AI summary" value={complaint.ai_summary} />
              <DetailRow label="Duplicate report" value={complaint.is_duplicate ? 'Yes' : 'No'} />
              <DetailRow label="Community votes" value={complaint.vote_count != null ? String(complaint.vote_count) : null} />
            </dl>
          </section>

          <section className="detail-panel">
            <div className="panel-heading"><div><p className="panel-eyebrow">Evidence</p><h2>Images</h2></div></div>
            {images.length ? (
              <div className="detail-image-grid">
                {images.map((item) => {
                  const src = mediaUrl(item?.image)
                  return src ? (
                    <a key={item.id || src} href={src} target="_blank" rel="noreferrer" className="detail-image-link">
                      <img src={src} alt="Complaint evidence" loading="lazy" />
                    </a>
                  ) : null
                })}
              </div>
            ) : <p className="muted-copy">No evidence images were attached.</p>}
          </section>

          <section className="detail-panel">
            <div className="panel-heading"><div><p className="panel-eyebrow">Lifecycle</p><h2>Complaint timeline</h2></div><CalendarDays size={19} /></div>
            <Timeline complaint={complaint} />
          </section>
        </main>

        <aside className="detail-sidebar">
          <section className="detail-panel">
            <div className="panel-heading"><div><p className="panel-eyebrow">Location</p><h2>Reported location</h2></div><MapPin size={19} /></div>
            <dl className="detail-grid detail-grid-single">
              <DetailRow label="Address" value={complaint.address} />
              <DetailRow label="Landmark" value={complaint.landmark} />
              <DetailRow label="Latitude" value={complaint.latitude != null ? String(complaint.latitude) : null} />
              <DetailRow label="Longitude" value={complaint.longitude != null ? String(complaint.longitude) : null} />
            </dl>
          </section>

          <section className="detail-panel">
            <div className="panel-heading"><div><p className="panel-eyebrow">Assignment</p><h2>Operational context</h2></div><UserRound size={19} /></div>
            <dl className="detail-grid detail-grid-single">
              <DetailRow label="Department" value={complaint.department ? 'Assigned' : 'Not assigned'} />
              <DetailRow label="Officer" value={complaint.assigned_officer ? 'Assigned to you' : 'Not assigned'} />
              <DetailRow label="Reported" value={formatDateTime(complaint.reported_at || complaint.created_at)} />
              <DetailRow label="Updated" value={formatDateTime(complaint.updated_at)} />
            </dl>
          </section>

          <section className="detail-panel officer-internal-panel">
            <div className="panel-heading"><div><p className="panel-eyebrow">Officer workflow</p><h2>Resolution information</h2></div><ChevronRight size={19} /></div>
            <dl className="detail-grid detail-grid-single">
              <DetailRow label="Resolution notes" value={complaint.resolution_notes} />
              <DetailRow label="Expected resolution" value={formatDateTime(complaint.expected_resolution_date)} />
            </dl>
            <p className="muted-copy">Update the complaint status and resolution information assigned to your officer account.</p>
          </section>

          <section className="detail-panel officer-update-panel">
            <div className="panel-heading"><div><p className="panel-eyebrow">Officer action</p><h2>Update complaint</h2></div></div>
            {updateError && <Alert tone="error">{updateError.message}</Alert>}
            {updateSuccess && <Alert tone="success">{updateSuccess}</Alert>}
            <form className="stack-form" onSubmit={submitUpdate}>
              <label className="field-label" htmlFor="officer-status">
                Status
                <select id="officer-status" className="input" value={status} onChange={(event) => setStatus(event.target.value)} disabled={updateLoading}>
                  {statusOptions.map((option) => <option key={option} value={option}>{formatStatus(option)}</option>)}
                </select>
              </label>
              <Textarea
                id="officer-resolution-notes"
                label="Resolution notes"
                value={resolutionNotes}
                onChange={(event) => setResolutionNotes(event.target.value)}
                placeholder="Add operational resolution notes…"
                disabled={updateLoading}
                rows={5}
              />
              <Input
                id="officer-expected-resolution"
                label="Expected resolution date"
                type="datetime-local"
                value={expectedResolutionDate}
                onChange={(event) => setExpectedResolutionDate(event.target.value)}
                disabled={updateLoading}
              />
              <Button type="submit" loading={updateLoading} disabled={!status}>Save update</Button>
            </form>
          </section>
        </aside>
      </div>
    </section>
  )
}
