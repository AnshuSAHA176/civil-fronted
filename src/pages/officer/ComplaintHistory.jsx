import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, RefreshCw } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { getOfficerComplaintHistory } from '../../features/officer/complaints.api'
import { formatDateTime, formatStatus, STATUS_TONES } from '../../features/complaints/complaints.utils'
import { getApiError } from '../../services/apiClient'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'

function normalizeHistory(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function Actor({ value }) {
  if (!value) return <span className="muted-copy">Recorded by the CivicAI workflow</span>
  return <span>{String(value)}</span>
}

export default function OfficerComplaintHistory() {
  const { complaintId } = useParams()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadHistory = useCallback(async () => {
    if (!complaintId) return
    setLoading(true)
    setError(null)
    try {
      const response = await getOfficerComplaintHistory(complaintId)
      setHistory(normalizeHistory(response.data))
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [complaintId])

  useEffect(() => { loadHistory() }, [loadHistory])

  if (loading) return <div className="detail-loading"><Spinner /><span>Loading complaint history…</span></div>

  if (error) {
    return (
      <section className="detail-page officer-history-page">
        <Button variant="ghost" onClick={() => navigate(`/officer/complaints/${encodeURIComponent(complaintId)}`)}><ArrowLeft size={16} /> Back to complaint</Button>
        <ErrorState title="Unable to load complaint history" description={error.message} onRetry={loadHistory} />
      </section>
    )
  }

  return (
    <section className="detail-page officer-history-page">
      <header className="detail-header">
        <div>
          <Button variant="ghost" onClick={() => navigate(`/officer/complaints/${encodeURIComponent(complaintId)}`)}><ArrowLeft size={16} /> Back to complaint</Button>
          <p className="eyebrow">Officer workspace</p>
          <p className="complaint-id">#{complaintId || 'ID unavailable'}</p>
          <h1>Complaint history</h1>
          <p className="muted-copy">A chronological audit trail of status transitions recorded by the backend.</p>
        </div>
        <Button variant="secondary" onClick={loadHistory}><RefreshCw size={16} /> Refresh</Button>
      </header>

      {!history.length ? (
        <section className="detail-panel">
          <div className="panel-heading"><div><p className="panel-eyebrow">Audit trail</p><h2>No status history yet</h2></div><CalendarDays size={19} /></div>
          <p className="muted-copy">No status transitions have been recorded for this complaint yet.</p>
        </section>
      ) : (
        <section className="detail-panel">
          <div className="panel-heading"><div><p className="panel-eyebrow">Audit trail</p><h2>Status transitions</h2></div><CalendarDays size={19} /></div>
          <ol className="complaint-history-list" aria-label="Complaint status history">
            {history.map((item, index) => {
              const oldStatus = item.old_status || ''
              const newStatus = item.new_status || ''
              return (
                <li key={item.id || `${item.changed_at}-${index}`} className="complaint-history-item">
                  <div className="complaint-history-marker" aria-hidden="true" />
                  <div className="complaint-history-content">
                    <div className="complaint-history-topline">
                      <div className="detail-badges">
                        {oldStatus && <Badge tone={STATUS_TONES[oldStatus] || 'neutral'}>{formatStatus(oldStatus)}</Badge>}
                        {oldStatus && newStatus && <span className="history-arrow" aria-hidden="true">→</span>}
                        {newStatus && <Badge tone={STATUS_TONES[newStatus] || 'neutral'}>{formatStatus(newStatus)}</Badge>}
                      </div>
                      <time dateTime={item.changed_at || undefined}>{formatDateTime(item.changed_at)}</time>
                    </div>
                    <p className="history-actor"><strong>Changed by:</strong> <Actor value={item.changed_by} /></p>
                    {item.note ? <p className="history-note">{item.note}</p> : <p className="muted-copy">No transition note was recorded.</p>}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </section>
  )
}
