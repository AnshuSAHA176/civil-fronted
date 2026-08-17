import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Heart, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'
import { getApiError } from '../../services/apiClient'
import { getCitizenLikedComplaints } from '../../features/complaints/complaints.api'
import { formatComplaintDate, formatPriority, formatStatus, normalizeLikedComplaints, PRIORITY_TONES, STATUS_TONES } from '../../features/complaints/complaints.utils'

export default function LikedComplaints() {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getCitizenLikedComplaints()
      setComplaints(normalizeLikedComplaints(response.data))
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="liked-complaints-loading"><Spinner /><span>Loading liked complaints…</span></div>

  return (
    <section className="liked-complaints-page">
      <header className="liked-complaints-header">
        <div>
          <Button variant="ghost" onClick={() => navigate('/citizen/complaints')}>
            <ArrowLeft size={17} aria-hidden="true" />
            Back to complaints
          </Button>
          <p className="eyebrow">Saved civic issues</p>
          <div className="liked-complaints-title-row">
            <div className="liked-complaints-title-icon"><Heart size={20} fill="currentColor" aria-hidden="true" /></div>
            <div>
              <h1>Liked complaints</h1>
              <p>Complaints you have supported with a like.</p>
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={load}><RefreshCw size={16} /> Refresh</Button>
      </header>

      {error ? (
        <ErrorState title="Unable to load liked complaints" description={error.message} onRetry={load} />
      ) : !complaints.length ? (
        <EmptyState
          title="No liked complaints"
          description="Complaints you like will appear here."
          action={<Button onClick={() => navigate('/citizen/complaints')}>Browse complaints</Button>}
        />
      ) : (
        <div className="liked-complaints-list">
          {complaints.map((complaint) => {
            const status = complaint?.status || 'pending'
            const priority = complaint?.priority || ''
            const id = complaint?.complaint_id || complaint?.id
            return (
              <article className="liked-complaint-card" key={id}>
                <div>
                  <p className="complaint-id">#{complaint?.complaint_id || 'ID unavailable'}</p>
                  <h2>{complaint?.title || 'Untitled complaint'}</h2>
                  <div className="complaint-card-badges">
                    <Badge tone={STATUS_TONES[status] || 'neutral'}>{formatStatus(status)}</Badge>
                    {priority && <Badge tone={PRIORITY_TONES[priority] || 'neutral'}>{formatPriority(priority)} priority</Badge>}
                  </div>
                  <p className="liked-complaint-meta">{formatComplaintDate(complaint?.created_at)} · {Number(complaint?.like_count || 0)} likes</p>
                </div>
                <Button variant="secondary" disabled={!id} onClick={() => navigate(`/citizen/complaints/${encodeURIComponent(id)}`)}>View details</Button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
