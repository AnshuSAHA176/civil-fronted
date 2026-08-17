import { useEffect, useState } from 'react'
import { ArrowLeft, Check, ExternalLink, FileText, RefreshCw, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { Alert } from '../../components/common/Alert'
import { Textarea } from '../../components/common/Textarea'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'
import { getOfficerRTIDetails, updateOfficerRTIStatus } from '../../features/officer/rti.api'
import { getApiError } from '../../services/apiClient'

const STATUS_LABELS = {
  summitted: 'Submitted',
  under_review: 'Under review',
  clarification_required: 'Clarification required',
  responded: 'Responded',
  rejected: 'Rejected',
}

const statusTone = (status) => {
  if (status === 'responded') return 'success'
  if (status === 'rejected') return 'danger'
  if (status === 'under_review' || status === 'clarification_required') return 'warning'
  return 'info'
}

const formatDate = (value) => {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const getFileUrl = (value) => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  const base = import.meta.env.VITE_API_BASE_URL || ''
  return `${base.replace(/\/$/, '')}/${String(value).replace(/^\//, '')}`
}

const ACTIONS = [
  { value: 'responded', label: 'Respond' },
  { value: 'clarification_required', label: 'Request clarification' },
  { value: 'rejected', label: 'Reject' },
]

export default function OfficerRTIDetails() {
  const navigate = useNavigate()
  const { rtiId } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [action, setAction] = useState('responded')
  const [responseText, setResponseText] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [clarificationReason, setClarificationReason] = useState('')
  const [responseFile, setResponseFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  const load = async () => {
    if (!rtiId) {
      setError('No RTI ID was provided.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await getOfficerRTIDetails(rtiId)
      setItem(response.data)
    } catch (requestError) {
      setError(getApiError(requestError).message)
      setItem(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [rtiId])

  const isDecided = item?.status === 'responded' || item?.status === 'rejected'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')

    if (action === 'responded' && !responseText.trim()) {
      setSubmitError('Enter a response before submitting.')
      return
    }
    if (action === 'rejected' && !rejectionReason.trim()) {
      setSubmitError('Enter a rejection reason before submitting.')
      return
    }
    if (action === 'clarification_required' && !clarificationReason.trim()) {
      setSubmitError('Enter what clarification is needed before submitting.')
      return
    }

    const payload = { action }
    if (action === 'responded') {
      payload.responce = responseText.trim()
      if (responseFile) payload.response_attachment = responseFile
    } else if (action === 'rejected') {
      payload.rejection_reason = rejectionReason.trim()
    } else if (action === 'clarification_required') {
      payload.clarification_reason = clarificationReason.trim()
    }

    setSubmitting(true)
    try {
      await updateOfficerRTIStatus(rtiId, payload)
      setSubmitSuccess('The RTI request was updated successfully.')
      setResponseText('')
      setRejectionReason('')
      setClarificationReason('')
      setResponseFile(null)
      await load()
    } catch (requestError) {
      setSubmitError(getApiError(requestError).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <section className="page-loading"><Spinner /><span>Loading RTI details…</span></section>
  }

  if (error) {
    return (
      <section className="rti-details-page">
        <Button type="button" variant="ghost" onClick={() => navigate('/officer/rti')}>
          <ArrowLeft size={17} aria-hidden="true" /> Back to RTI requests
        </Button>
        <ErrorState title="Unable to load this RTI" description={error} onRetry={load} />
      </section>
    )
  }

  if (!item) return null

  const attachmentUrl = getFileUrl(item.attachment)

  return (
    <section className="rti-details-page">
      <div className="rti-detail-topbar">
        <Button type="button" variant="ghost" onClick={() => navigate('/officer/rti')}>
          <ArrowLeft size={17} aria-hidden="true" /> Back to RTI requests
        </Button>
        <Button type="button" variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" /> Refresh
        </Button>
      </div>

      <header className="card rti-detail-header">
        <div>
          <p className="eyebrow">Right to Information</p>
          <p className="rti-id">{item.rti_id || 'RTI request'}</p>
          <h1>{item.subject || 'Untitled RTI request'}</h1>
          <p className="muted">Submitted {formatDate(item.created_at)}</p>
        </div>
        <Badge tone={statusTone(item.status)}>{STATUS_LABELS[item.status] || item.status || 'Unknown status'}</Badge>
      </header>

      <div className="rti-detail-grid">
        <main className="rti-detail-main">
          <section className="card rti-detail-section">
            <div className="section-heading">
              <div><p className="eyebrow">Request</p><h2>Information requested</h2></div>
              <FileText size={21} aria-hidden="true" />
            </div>
            <dl className="detail-list">
              <div><dt>Subject</dt><dd>{item.subject || 'Not provided'}</dd></div>
              <div><dt>Description</dt><dd className="detail-prewrap">{item.description || 'No description provided.'}</dd></div>
            </dl>
          </section>

          <section className="card rti-detail-section">
            <div className="section-heading">
              <div><p className="eyebrow">Attachment</p><h2>Citizen's supporting document</h2></div>
            </div>
            {attachmentUrl ? (
              <div className="attachment-row">
                <div><strong>Attached file</strong><p className="muted">Provided with this RTI request.</p></div>
                <a className="button button-secondary" href={attachmentUrl} target="_blank" rel="noreferrer">Open file <ExternalLink size={15} aria-hidden="true" /></a>
              </div>
            ) : <p className="muted">No attachment was provided.</p>}
          </section>

          <section className="card rti-detail-section">
            <div className="section-heading">
              <div><p className="eyebrow">Action</p><h2>{isDecided ? 'Decision recorded' : 'Respond to this request'}</h2></div>
            </div>

            {isDecided ? (
              <p className="muted">This RTI request has already been {item.status === 'responded' ? 'responded to' : 'rejected'}. No further action is needed.</p>
            ) : (
              <form onSubmit={handleSubmit} className="rti-action-form">
                <div className="field">
                  <span className="field-label">Choose an action</span>
                  <div className="rti-action-choices">
                    {ACTIONS.map((option) => (
                      <label key={option.value} className={`rti-action-choice${action === option.value ? ' active' : ''}`}>
                        <input
                          type="radio"
                          name="rti-action"
                          value={option.value}
                          checked={action === option.value}
                          onChange={() => setAction(option.value)}
                          disabled={submitting}
                        />
                        {option.value === 'responded' && <Check size={15} aria-hidden="true" />}
                        {option.value === 'rejected' && <X size={15} aria-hidden="true" />}
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>

                {action === 'responded' && (
                  <>
                    <Textarea
                      label="Response"
                      value={responseText}
                      onChange={(event) => setResponseText(event.target.value)}
                      placeholder="Provide the information requested…"
                      rows={6}
                      disabled={submitting}
                      required
                    />
                    <div className="field">
                      <label htmlFor="response-attachment">Response attachment (optional)</label>
                      <input
                        id="response-attachment"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(event) => setResponseFile(event.target.files?.[0] || null)}
                        disabled={submitting}
                      />
                    </div>
                  </>
                )}

                {action === 'rejected' && (
                  <Textarea
                    label="Rejection reason"
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    placeholder="Explain why this request is being rejected…"
                    rows={5}
                    disabled={submitting}
                    required
                  />
                )}

                {action === 'clarification_required' && (
                  <Textarea
                    label="Clarification needed"
                    value={clarificationReason}
                    onChange={(event) => setClarificationReason(event.target.value)}
                    placeholder="Explain what additional information you need from the citizen…"
                    rows={5}
                    disabled={submitting}
                    required
                  />
                )}

                {submitError && <Alert tone="danger">{submitError}</Alert>}
                {submitSuccess && <Alert tone="success">{submitSuccess}</Alert>}

                <Button type="submit" loading={submitting} disabled={submitting}>Submit</Button>
              </form>
            )}
          </section>
        </main>

        <aside className="rti-detail-side">
          <section className="card rti-detail-section">
            <div className="section-heading"><div><p className="eyebrow">Request information</p><h2>Details</h2></div></div>
            <dl className="detail-list compact">
              <div><dt>RTI ID</dt><dd>{item.rti_id || 'Not available'}</dd></div>
              <div><dt>Complaint</dt><dd>{item.complain || 'Not available'}</dd></div>
              <div><dt>Status</dt><dd>{STATUS_LABELS[item.status] || item.status || 'Unknown'}</dd></div>
              <div><dt>Submitted</dt><dd>{formatDate(item.created_at)}</dd></div>
              <div><dt>Due date</dt><dd>{formatDate(item.due_date)}</dd></div>
              <div><dt>Assigned</dt><dd>{formatDate(item.assigned_at)}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </section>
  )
}
