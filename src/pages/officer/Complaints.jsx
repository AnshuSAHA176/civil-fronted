import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronRight, FileText, Filter, RefreshCw, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getOfficerComplaints } from '../../features/officer/complaints.api'
import { formatComplaintDate, formatPriority, formatStatus, normalizeComplaints, PRIORITY_TONES, STATUS_TONES } from '../../features/complaints/complaints.utils'
import { getApiError } from '../../services/apiClient'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'

const STATUS_OPTIONS = ['', 'pending', 'assigned', 'accepted', 'inspection', 'in_progress', 'resolved', 'closed', 'rejected', 'reopened']
const PRIORITY_OPTIONS = ['', 'low', 'medium', 'high', 'critical']
const CATEGORY_OPTIONS = ['', 'road', 'water', 'garbage', 'electricity', 'sanitation', 'street_light', 'other']

const CATEGORY_LABELS = {
  road: 'Road',
  water: 'Water',
  garbage: 'Garbage',
  electricity: 'Electricity',
  sanitation: 'Sanitation',
  street_light: 'Street light',
  other: 'Other',
}

function formatCategory(value) {
  return CATEGORY_LABELS[value] || String(value || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function ComplaintCard({ complaint, onOpen }) {
  const status = complaint?.status || 'pending'
  const priority = complaint?.priority || ''

  return (
    <article className="complaint-card officer-complaint-card">
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
          {complaint?.category && <Badge tone="neutral">{formatCategory(complaint.category)}</Badge>}
        </div>

        <div className="complaint-card-meta">
          <span>{formatComplaintDate(complaint?.created_at)}</span>
          <span>{Number(complaint?.like_count || 0)} likes</span>
        </div>
      </div>

      <Button variant="secondary" className="complaint-view-button" onClick={onOpen} disabled={!complaint?.complaint_id}>
        View complaint
      </Button>
    </article>
  )
}

export default function OfficerComplaints() {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')

  const loadComplaints = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getOfficerComplaints()
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
      const matchesCategory = !category || complaint?.category === category
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory
    })
  }, [complaints, search, status, priority, category])

  const clearFilters = () => {
    setSearch('')
    setStatus('')
    setPriority('')
    setCategory('')
  }

  if (loading) {
    return <div className="complaints-loading"><Spinner /><span>Loading your assigned complaints…</span></div>
  }

  if (error) {
    return (
      <section className="complaints-page officer-complaints-page">
        <ComplaintsHeader count={complaints.length} onRefresh={loadComplaints} />
        <ErrorState title="Unable to load assigned complaints" description={error.message} onRetry={loadComplaints} />
      </section>
    )
  }

  return (
    <section className="complaints-page officer-complaints-page">
      <ComplaintsHeader count={complaints.length} onRefresh={loadComplaints} />

      <section className="complaints-toolbar" aria-label="Assigned complaint filters">
        <div className="complaint-search-wrap">
          <Search size={17} aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by complaint ID or title"
            aria-label="Search assigned complaints"
          />
        </div>

        <div className="complaint-filter-group officer-filter-group">
          <Filter size={16} aria-hidden="true" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.slice(1).map((option) => <option key={option} value={option}>{formatStatus(option)}</option>)}
          </select>
          <select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Filter by priority">
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.slice(1).map((option) => <option key={option} value={option}>{formatPriority(option)}</option>)}
          </select>
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.slice(1).map((option) => <option key={option} value={option}>{formatCategory(option)}</option>)}
          </select>
        </div>
      </section>

      {!complaints.length ? (
        <EmptyState
          title="No assigned complaints"
          description="Complaints assigned to you will appear here when the department assigns them to your account."
        />
      ) : !filteredComplaints.length ? (
        <EmptyState
          title="No matching complaints"
          description="Try changing the search or filters."
          action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
        />
      ) : (
        <div className="complaint-list" aria-label="Assigned complaints">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard
              key={complaint?.complaint_id || complaint?.id}
              complaint={complaint}
              onOpen={() => navigate(`/officer/complaints/${complaint.complaint_id}`)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ComplaintsHeader({ count, onRefresh }) {
  return (
    <header className="complaints-header">
      <div>
        <p className="eyebrow">Officer workspace</p>
        <div className="complaints-title-row">
          <h1>Assigned complaints</h1>
          <span className="complaints-count"><FileText size={14} /> {count}</span>
        </div>
        <p>Review complaints currently assigned to you and focus on the issues that need action.</p>
      </div>
      <div className="complaints-header-actions">
        <Button variant="secondary" onClick={onRefresh}><RefreshCw size={16} /> Refresh</Button>
      </div>
    </header>
  )
}
