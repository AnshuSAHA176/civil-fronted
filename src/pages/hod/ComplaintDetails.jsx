import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, FileText, MapPin, RefreshCw, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { assignHodComplaint, getHodComplaintDetails, getHodOfficers } from '../../features/hod/complaints.api'
import { getApiError } from '../../services/apiClient'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'
import { Alert } from '../../components/common/Alert'
import { mediaUrl, formatConfidence, formatDateTime, formatPriority, formatStatus, STATUS_TONES, PRIORITY_TONES } from '../../features/complaints/complaints.utils'

function DetailRow({ label, value }) { return <div className="detail-row"><dt>{label}</dt><dd>{value || 'Not available'}</dd></div> }

function Timeline({ complaint }) {
  const events = [['Reported', complaint?.reported_at || complaint?.created_at], ['Assigned', complaint?.assigned_at], ['Accepted', complaint?.accepted_at], ['Expected resolution', complaint?.expected_resolution_date], ['Resolved', complaint?.resolved_at], ['Closed', complaint?.closed_at]].filter(([, value]) => value)
  return events.length ? <ol className="complaint-timeline" aria-label="Complaint lifecycle">{events.map(([label, value]) => <li key={`${label}-${value}`} className="complaint-timeline-item"><span className="complaint-timeline-dot" aria-hidden="true" /><div><strong>{label}</strong><time dateTime={value}>{formatDateTime(value)}</time></div></li>)}</ol> : <p className="muted-copy">No lifecycle timestamps are available.</p>
}

export default function HodComplaintDetails() {
  const { complaintId } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [officers, setOfficers] = useState([])
  const [selectedOfficer, setSelectedOfficer] = useState('')
  const [loading, setLoading] = useState(true)
  const [officersLoading, setOfficersLoading] = useState(true)
  const [error, setError] = useState(null)
  const [officersError, setOfficersError] = useState(null)
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState(null)
  const [success, setSuccess] = useState('')

  const loadComplaint = useCallback(async () => {
    if (!complaintId) return
    setLoading(true); setError(null)
    try { const response = await getHodComplaintDetails(complaintId); setComplaint(response.data) } catch (requestError) { setError(getApiError(requestError)) } finally { setLoading(false) }
  }, [complaintId])

  const loadOfficers = useCallback(async () => {
    setOfficersLoading(true); setOfficersError(null)
    try { const response = await getHodOfficers(); setOfficers(Array.isArray(response.data) ? response.data : []) } catch (requestError) { setOfficersError(getApiError(requestError)) } finally { setOfficersLoading(false) }
  }, [])

  useEffect(() => { loadComplaint() }, [loadComplaint])
  useEffect(() => { loadOfficers() }, [loadOfficers])
  useEffect(() => { setSelectedOfficer(complaint?.assigned_officer?.employee_id || '') }, [complaint])

  const assignableOfficers = useMemo(() => officers.filter((officer) => !officer.in_work || officer.employee_id === complaint?.assigned_officer?.employee_id), [officers, complaint])

  const handleAssign = async (event) => {
    event.preventDefault()
    if (!complaintId || !selectedOfficer) return
    setAssigning(true); setAssignError(null); setSuccess('')
    try {
      const response = await assignHodComplaint(complaintId, selectedOfficer)
      setComplaint(response.data)
      setSuccess('Officer assignment updated successfully.')
    } catch (requestError) { setAssignError(getApiError(requestError)) } finally { setAssigning(false) }
  }

  if (loading) return <div className="detail-loading"><Spinner /><span>Loading complaint details…</span></div>
  if (error || !complaint) return <section className="detail-page hod-detail-page"><Button variant="ghost" onClick={() => navigate('/hod/complaints')}><ArrowLeft size={16} /> Back to complaints</Button><ErrorState title="Unable to load this complaint" description={error?.message || 'The complaint details are unavailable.'} onRetry={loadComplaint} /></section>

  const currentStatus = complaint.status || 'pending'
  const images = Array.isArray(complaint.images) ? complaint.images : []
  const isClosed = ['resolved', 'closed'].includes(currentStatus)

  return (
    <section className="detail-page hod-detail-page">
      <header className="detail-header">
        <div><Button variant="ghost" onClick={() => navigate('/hod/complaints')}><ArrowLeft size={16} /> Back to complaint management</Button><p className="eyebrow">Department workspace</p><p className="complaint-id">#{complaint.complaint_id || 'ID unavailable'}</p><h1>{complaint.title || 'Untitled complaint'}</h1><div className="detail-badges"><Badge tone={STATUS_TONES[currentStatus] || 'neutral'}>{formatStatus(currentStatus)}</Badge>{complaint.priority && <Badge tone={PRIORITY_TONES[complaint.priority] || 'neutral'}>{formatPriority(complaint.priority)} priority</Badge>}</div></div>
        <div className="detail-header-actions"><Button variant="secondary" onClick={loadComplaint}><RefreshCw size={16} /> Refresh</Button></div>
      </header>

      <div className="detail-layout">
        <main className="detail-main">
          <section className="detail-panel"><div className="panel-heading"><div><p className="panel-eyebrow">Issue</p><h2>Description</h2></div><FileText size={19} /></div><p className="detail-description">{complaint.description || 'No description provided.'}</p></section>
          <section className="detail-panel"><div className="panel-heading"><div><p className="panel-eyebrow">CivicAI analysis</p><h2>Classification</h2></div><ShieldCheck size={19} /></div><dl className="detail-grid"><DetailRow label="Category" value={complaint.category ? formatPriority(complaint.category) : null} /><DetailRow label="AI confidence" value={formatConfidence(complaint.ai_confidence)} /><DetailRow label="AI summary" value={complaint.ai_summary} /><DetailRow label="Duplicate report" value={complaint.is_duplicate ? 'Yes' : 'No'} /><DetailRow label="Community votes" value={complaint.vote_count != null ? String(complaint.vote_count) : null} /></dl></section>
          <section className="detail-panel"><div className="panel-heading"><div><p className="panel-eyebrow">Evidence</p><h2>Images</h2></div></div>{images.length ? <div className="detail-image-grid">{images.map((item) => { const src = mediaUrl(item?.image); return src ? <a key={item.id || src} href={src} target="_blank" rel="noreferrer" className="detail-image-link"><img src={src} alt="Complaint evidence" loading="lazy" /></a> : null })}</div> : <p className="muted-copy">No evidence images were attached.</p>}</section>
          <section className="detail-panel"><div className="panel-heading"><div><p className="panel-eyebrow">Lifecycle</p><h2>Complaint timeline</h2></div><CalendarDays size={19} /></div><Timeline complaint={complaint} /></section>
        </main>

        <aside className="detail-sidebar">
          <section className="detail-panel hod-assignment-panel"><div className="panel-heading"><div><p className="panel-eyebrow">Officer assignment</p><h2>Assign complaint</h2></div><UserRound size={19} /></div>
            {success && <Alert tone="success">{success}</Alert>}
            {assignError && <Alert tone="danger">{assignError.message}</Alert>}
            {isClosed ? <p className="muted-copy">Resolved and closed complaints cannot be reassigned.</p> : officersError ? <div className="assignment-error"><p>{officersError.message}</p><Button variant="secondary" onClick={loadOfficers}>Try again</Button></div> : <form onSubmit={handleAssign} className="hod-assignment-form"><label htmlFor="hod-officer">Officer</label><select id="hod-officer" value={selectedOfficer} onChange={(event) => setSelectedOfficer(event.target.value)} disabled={assigning || officersLoading} required><option value="">{officersLoading ? 'Loading officers…' : 'Select an officer'}</option>{assignableOfficers.map((officer) => <option key={officer.employee_id} value={officer.employee_id}>{officer.email}{officer.designation ? ` · ${officer.designation}` : ''}{officer.in_work && officer.employee_id === complaint.assigned_officer?.employee_id ? ' · Current assignment' : ''}</option>)}</select><p className="field-help">Only officers in your department are available. Officers with another active complaint are excluded.</p><Button type="submit" loading={assigning} disabled={!selectedOfficer || officersLoading || isClosed}>Assign officer</Button></form>}
          </section>

          <section className="detail-panel"><div className="panel-heading"><div><p className="panel-eyebrow">Complaint context</p><h2>Operational information</h2></div></div><dl className="detail-grid detail-grid-single"><DetailRow label="Citizen" value={complaint.citizen?.email || complaint.citizen_email} /><DetailRow label="Department" value={complaint.department ? 'Assigned to this department' : null} /><DetailRow label="Assigned officer" value={complaint.assigned_officer?.email || null} /><DetailRow label="Expected resolution" value={formatDateTime(complaint.expected_resolution_date)} /><DetailRow label="Reported" value={formatDateTime(complaint.reported_at || complaint.created_at)} /></dl></section>
          <section className="detail-panel"><div className="panel-heading"><div><p className="panel-eyebrow">Location</p><h2>Reported location</h2></div><MapPin size={19} /></div><dl className="detail-grid detail-grid-single"><DetailRow label="Address" value={complaint.address} /><DetailRow label="Landmark" value={complaint.landmark} /><DetailRow label="Latitude" value={complaint.latitude != null ? String(complaint.latitude) : null} /><DetailRow label="Longitude" value={complaint.longitude != null ? String(complaint.longitude) : null} /></dl></section>
        </aside>
      </div>
    </section>
  )
}
