import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, FileText, RefreshCw } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'
import { getCitizenRTIDetails } from '../../features/rti.api'
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
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const getFileUrl = (value) => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  const base = import.meta.env.VITE_API_BASE_URL || ''
  return `${base.replace(/\/$/, '')}/${String(value).replace(/^\//, '')}`
}

export default function RTIDetails() {
  const navigate = useNavigate()
  const { rtiId } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    if (!rtiId) {
      setError('No RTI ID was provided.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await getCitizenRTIDetails(rtiId)
      setItem(response.data)
    } catch (requestError) {
      setError(getApiError(requestError).message)
      setItem(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [rtiId])

  if (loading) {
    return (
      <section className="page-loading">
        <Spinner />
        <span>Loading RTI details…</span>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rti-details-page">
        <Button type="button" variant="ghost" onClick={() => navigate('/citizen/rti')}>
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
        <Button type="button" variant="ghost" onClick={() => navigate('/citizen/rti')}>
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
        <Badge tone={statusTone(item.status)}>
          {STATUS_LABELS[item.status] || item.status || 'Unknown status'}
        </Badge>
      </header>

      <div className="rti-detail-grid">
        <main className="rti-detail-main">
          <section className="card rti-detail-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Request</p>
                <h2>Information requested</h2>
              </div>
              <FileText size={21} aria-hidden="true" />
            </div>

            <dl className="detail-list">
              <div>
                <dt>Subject</dt>
                <dd>{item.subject || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Description</dt>
                <dd className="detail-prewrap">{item.description || 'No description provided.'}</dd>
              </div>
            </dl>
          </section>

          <section className="card rti-detail-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Attachment</p>
                <h2>Supporting document</h2>
              </div>
            </div>

            {attachmentUrl ? (
              <div className="attachment-row">
                <div>
                  <strong>Attached file</strong>
                  <p className="muted">Provided with this RTI request.</p>
                </div>
                <a className="button button-secondary" href={attachmentUrl} target="_blank" rel="noreferrer">
                  Open file <ExternalLink size={15} aria-hidden="true" />
                </a>
              </div>
            ) : (
              <p className="muted">No attachment was provided.</p>
            )}
          </section>
        </main>

        <aside className="rti-detail-side">
          <section className="card rti-detail-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Request information</p>
                <h2>Details</h2>
              </div>
            </div>

            <dl className="detail-list compact">
              <div>
                <dt>RTI ID</dt>
                <dd>{item.rti_id || 'Not available'}</dd>
              </div>
              <div>
                <dt>Complaint</dt>
                <dd>{item.complain || 'Not available'}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{STATUS_LABELS[item.status] || item.status || 'Unknown'}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{formatDate(item.created_at)}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>{formatDate(item.due_date)}</dd>
              </div>
              <div>
                <dt>Assigned</dt>
                <dd>{formatDate(item.assigned_at)}</dd>
              </div>
            </dl>
          </section>

          <section className="card rti-detail-section">
            <p className="eyebrow">Processing</p>
            <h2>Assignment</h2>
            <p className="muted">
              {item.department
                ? 'A department has been assigned to this request.'
                : 'A department has not been assigned yet.'}
            </p>
            <p className="muted">
              {item.pio
                ? 'A Public Information Officer is assigned to this request.'
                : 'A Public Information Officer is not assigned yet.'}
            </p>
          </section>

          <section className="card rti-detail-note">
            <strong>Response information</strong>
            <p className="muted">
              The current RTI detail endpoint returns the request itself. Response text,
              rejection reasons, clarification messages, and response attachments are stored
              in a separate backend model and are not included by this endpoint.
            </p>
          </section>
        </aside>
      </div>
    </section>
  )
}
