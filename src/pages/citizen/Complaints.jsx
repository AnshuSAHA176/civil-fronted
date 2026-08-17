import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronRight, FileText, Filter, RefreshCw, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCitizenComplaints } from '../../features/complaints/complaints.api'
import { formatComplaintDate, formatPriority, formatStatus, normalizeComplaints, PRIORITY_TONES, STATUS_TONES } from '../../features/complaints/complaints.utils'
import { getApiError } from '../../services/apiClient'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'
import { Alert } from '../../components/common/Alert'

const STATUS_OPTIONS = ['', 'pending', 'assigned', 'accepted', 'inspection', 'in_progress', 'resolved', 'closed', 'rejected', 'reopened']
const PRIORITY_OPTIONS = ['', 'low', 'medium', 'high', 'critical']

function ComplaintCard({ complaint, onOpen }) {
  const status = complaint?.status || 'pending'
  const priority = complaint?.priority || ''

  return (
    <article className="complaint-card">
      <div className="complaint-card-main">
        <div className="complaint-card-heading">
          <div className="complaint-card-title-wrap">
            <p className="complaint-id">#{complaint?.complaint_id || 'ID unavailable'}</p>
            <h2>{complaint?.title || 'Untitled complaint'}</h2>
          </div>
          <ChevronRight className="complaint-card-arrow" size={19} aria-hidden="true" />
        </div>

        <div className="complaint-card-badges">
          <Badge tone={STATUS_TONES[status] || 'neutral'}>{formatStatus(status)}</Badge>
          {priority && <Badge tone={PRIORITY_TONES[priority] || 'neutral'}>{formatPriority(priority)} priority</Badge>}
        </div>

        <div className="complaint-card-meta">
          <span>{formatComplaintDate(complaint?.created_at)}</span>
          <span>{Number(complaint?.like_count || 0)} likes</span>
        </div>
      </div>

      <Button variant="secondary" className="complaint-view-button" onClick={onOpen} disabled={!complaint?.complaint_id}>
        View details
      </Button>
    </article>
  )
}

export default function Complaints() {
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = location.state?.successMessage
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')

  const loadComplaints = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getCitizenComplaints()
      setComplaints(normalizeComplaints(response.data))
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadComplaints()
  }, [loadComplaints])

  const filteredComplaints = useMemo(() => {
    const query = search.trim().toLowerCase()
    return complaints.filter((complaint) => {
      const matchesSearch = !query || [complaint?.complaint_id, complaint?.title].some((value) => String(value || '').toLowerCase().includes(query))
      const matchesStatus = !status || complaint?.status === status
      const matchesPriority = !priority || complaint?.priority === priority
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [complaints, search, status, priority])

  if (loading) {
    return <div className="complaints-loading"><Spinner /><span>Loading your complaints…</span></div>
  }

  if (error) {
    return (
      <section className="complaints-page">
        <ComplaintsHeader count={complaints.length} onRefresh={loadComplaints} onCreate={() => navigate('/citizen/complaints/new')} />
        <ErrorState title="Unable to load your complaints" description={error.message} onRetry={loadComplaints} />
      </section>
    )
  }

  return (
    <section className="complaints-page">
      {successMessage && <Alert tone="success">{successMessage}</Alert>}
      <ComplaintsHeader count={complaints.length} onRefresh={loadComplaints} onCreate={() => navigate('/citizen/complaints/new')} />

      <section className="complaints-toolbar" aria-label="Complaint filters">
        <div className="complaint-search-wrap">
          <Search size={17} aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by complaint ID or title"
            aria-label="Search complaints"
          />
        </div>

        <div className="complaint-filter-group">
          <Filter size={16} aria-hidden="true" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.slice(1).map((option) => <option key={option} value={option}>{formatStatus(option)}</option>)}
          </select>
          <select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Filter by priority">
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.slice(1).map((option) => <option key={option} value={option}>{formatPriority(option)}</option>)}
          </select>
        </div>
      </section>

      {!complaints.length ? (
        <EmptyState
          title="No complaints yet"
          description="You haven't reported any civic issues yet. Your submitted complaints will appear here."
          action={<Button onClick={() => navigate('/citizen/complaints/new')}>Report an issue</Button>}
        />
      ) : !filteredComplaints.length ? (
        <EmptyState
          title="No matching complaints"
          description="Try changing the search text or clearing one of the filters."
          action={<Button variant="secondary" onClick={() => { setSearch(''); setStatus(''); setPriority('') }}>Clear filters</Button>}
        />
      ) : (
        <div className="complaint-list" aria-label="Your complaints">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard
              key={complaint?.complaint_id || complaint?.id}
              complaint={complaint}
              onOpen={() => navigate(`/citizen/complaints/${complaint.complaint_id}`)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ComplaintsHeader({ count, onRefresh, onCreate }) {
  return (
    <header className="complaints-header">
      <div>
        <p className="eyebrow">Citizen complaints</p>
        <div className="complaints-title-row">
          <h1>My complaints</h1>
          <span className="complaints-count"><FileText size={14} /> {count}</span>
        </div>
        <p>Review the civic issues you've reported and their current status.</p>
      </div>
      <div className="complaints-header-actions">
        <Button onClick={onCreate}>Report an issue</Button>
        <Button variant="secondary" onClick={onRefresh}><RefreshCw size={16} /> Refresh</Button>
      </div>
    </header>
  )
}
