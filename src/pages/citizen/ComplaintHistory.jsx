import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Clock3, History as HistoryIcon } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'
import { getApiError } from '../../services/apiClient'
import { getCitizenComplaintDetails, getCitizenComplaintHistory } from '../../features/complaints/complaints.api'
import {
  formatDateTime,
  formatStatus,
  STATUS_TONES,
} from '../../features/complaints/complaints.utils'

function normalizeHistory(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function HistoryEntry({ item, isFirst }) {
  const oldStatus = item?.old_status
  const newStatus = item?.new_status
  const hasTransition = Boolean(oldStatus || newStatus)

  return (
    <article className={`complaint-history-entry${isFirst ? ' is-first' : ''}`}>
      <span className="complaint-history-dot" aria-hidden="true" />
      <div className="complaint-history-card">
        <div className="complaint-history-card-header">
          <div>
            <p className="panel-eyebrow">Status update</p>
            {hasTransition ? (
              <div className="complaint-history-transition">
                {oldStatus && (
                  <Badge tone={STATUS_TONES[oldStatus] || 'neutral'}>{formatStatus(oldStatus)}</Badge>
                )}
                {oldStatus && newStatus && <ArrowRight size={15} aria-hidden="true" />}
                {newStatus && (
                  <Badge tone={STATUS_TONES[newStatus] || 'neutral'}>{formatStatus(newStatus)}</Badge>
                )}
              </div>
            ) : (
              <h2>Status recorded</h2>
            )}
          </div>
          <div className="complaint-history-time">
            <Clock3 size={14} aria-hidden="true" />
            <span>{formatDateTime(item?.changed_at)}</span>
          </div>
        </div>

        {item?.note && (
          <div className="complaint-history-note">
            <span>Note</span>
            <p>{item.note}</p>
          </div>
        )}

        <p className="complaint-history-actor">
          {item?.changed_by ? 'Updated by an authorized CivicAI user.' : 'Status change recorded by CivicAI.'}
        </p>
      </div>
    </article>
  )
}

export default function ComplaintHistory() {
  const { complaintId } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadHistory = useCallback(async () => {
    if (!complaintId) return
    setLoading(true)
    setError(null)

    try {
      const [complaintResponse, historyResponse] = await Promise.all([
        getCitizenComplaintDetails(complaintId),
        getCitizenComplaintHistory(complaintId),
      ])

      setComplaint(complaintResponse.data || null)
      setHistory(normalizeHistory(historyResponse.data))
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [complaintId])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const orderedHistory = useMemo(() => (
    [...history].sort((a, b) => {
      const aTime = new Date(a?.changed_at || 0).getTime()
      const bTime = new Date(b?.changed_at || 0).getTime()
      return bTime - aTime
    })
  ), [history])

  if (loading) {
    return (
      <div className="complaint-history-loading">
        <Spinner />
        <span>Loading complaint history…</span>
      </div>
    )
  }

  if (error) {
    return (
      <section className="complaint-history-page">
        <Button variant="ghost" onClick={() => navigate(`/citizen/complaints/${encodeURIComponent(complaintId)}`)}>
          <ArrowLeft size={17} aria-hidden="true" />
          Back to complaint
        </Button>
        <ErrorState
          title="Unable to load complaint history"
          description={error.message}
          onRetry={loadHistory}
        />
      </section>
    )
  }

  return (
    <section className="complaint-history-page">
      <Button variant="ghost" onClick={() => navigate(`/citizen/complaints/${encodeURIComponent(complaintId)}`)}>
        <ArrowLeft size={17} aria-hidden="true" />
        Back to complaint
      </Button>

      <header className="complaint-history-header">
        <div>
          <p className="eyebrow">Complaint history</p>
          <p className="complaint-history-id">#{complaint?.complaint_id || complaintId}</p>
          <h1>{complaint?.title || 'Complaint status history'}</h1>
          <p>Every status transition recorded for this complaint.</p>
        </div>
        <div className="complaint-history-header-actions">
          <Link className="button button-secondary" to={`/citizen/complaints/${encodeURIComponent(complaintId)}`}>
            View complaint
          </Link>
        </div>
      </header>

      {orderedHistory.length === 0 ? (
        <section className="complaint-history-empty">
          <div className="complaint-history-empty-icon" aria-hidden="true">
            <HistoryIcon size={22} />
          </div>
          <h2>No status history yet</h2>
          <p>CivicAI has not recorded a status transition for this complaint yet.</p>
        </section>
      ) : (
        <section className="complaint-history-panel" aria-label="Complaint status history">
          <div className="complaint-history-timeline">
            {orderedHistory.map((item, index) => (
              <HistoryEntry key={item?.id || `${item?.changed_at || 'entry'}-${index}`} item={item} isFirst={index === 0} />
            ))}
          </div>
        </section>
      )}
    </section>
  )
}
