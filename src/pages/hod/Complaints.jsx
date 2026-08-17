import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronRight, Filter, RefreshCw, Search, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getHodComplaints } from '../../features/hod/complaints.api'
import { getApiError } from '../../services/apiClient'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'
import { formatComplaintDate, formatPriority, formatStatus, PRIORITY_TONES, STATUS_TONES } from '../../features/complaints/complaints.utils'

const STATUS_OPTIONS = ['', 'pending', 'assigned', 'accepted', 'inspection', 'in_progress', 'resolved', 'closed', 'rejected', 'reopened']
const PRIORITY_OPTIONS = ['', 'low', 'medium', 'high', 'critical']
const CATEGORY_OPTIONS = ['', 'road', 'water', 'garbage', 'electricity', 'sanitation', 'street_light', 'other']
const ASSIGNMENT_OPTIONS = ['', 'true', 'false']

const categoryLabel = (value) => String(value || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

function assignedLabel(officer) {
  if (!officer) return 'Unassigned'
  return officer.email || 'Assigned officer'
}

export default function HodComplaints() {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')
  const [assigned, setAssigned] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getHodComplaints({ status, priority, category, assigned })
      setComplaints(Array.isArray(response.data) ? response.data : [])
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [status, priority, category, assigned])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return complaints
    return complaints.filter((complaint) => [complaint.complaint_id, complaint.title, complaint.citizen_email, complaint.assigned_officer?.email]
      .some((value) => String(value || '').toLowerCase().includes(query)))
  }, [complaints, search])

  const clearFilters = () => {
    setSearch('')
    setStatus('')
    setPriority('')
    setCategory('')
    setAssigned('')
  }

  if (loading) return <div className="complaints-loading"><Spinner /><span>Loading department complaints…</span></div>

  const header = (
    <header className="complaints-header">
      <div>
        <div className="complaints-title-row"><div><p className="eyebrow">Department workspace</p><h1>Complaint management</h1></div><span className="complaints-count">{filtered.length} shown</span></div>
        <p>Review complaints belonging to your department and open a complaint to manage its assignment.</p>
      </div>
      <Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={16} /> Refresh</Button>
    </header>
  )

  if (error) return <section className="complaints-page hod-complaints-page">{header}<ErrorState title="Unable to load department complaints" description={error.message} onRetry={load} /></section>

  return (
    <section className="complaints-page hod-complaints-page">
      {header}
      <section className="complaints-toolbar" aria-label="Department complaint filters">
        <div className="complaint-search-wrap"><Search size={17} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search complaint, citizen, or officer" aria-label="Search department complaints" /></div>
        <div className="complaint-filter-group hod-filter-group">
          <Filter size={16} aria-hidden="true" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="">All statuses</option>{STATUS_OPTIONS.slice(1).map((value) => <option key={value} value={value}>{formatStatus(value)}</option>)}</select>
          <select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Filter by priority"><option value="">All priorities</option>{PRIORITY_OPTIONS.slice(1).map((value) => <option key={value} value={value}>{formatPriority(value)}</option>)}</select>
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category"><option value="">All categories</option>{CATEGORY_OPTIONS.slice(1).map((value) => <option key={value} value={value}>{categoryLabel(value)}</option>)}</select>
          <select value={assigned} onChange={(event) => setAssigned(event.target.value)} aria-label="Filter by assignment"><option value="">All assignments</option><option value="true">Assigned</option><option value="false">Unassigned</option></select>
        </div>
      </section>

      {!complaints.length ? (
        <EmptyState title="No department complaints" description="There are currently no complaints matching the selected filters." />
      ) : !filtered.length ? (
        <EmptyState title="No matching complaints" description="Try changing the search or filters." action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>} />
      ) : (
        <div className="complaint-list">
          {filtered.map((complaint) => (
            <article className="complaint-card hod-complaint-card" key={complaint.complaint_id}>
              <div className="complaint-card-main">
                <div className="complaint-card-heading">
                  <div className="complaint-card-title-wrap"><p className="complaint-id">#{complaint.complaint_id}</p><h2>{complaint.title || 'Untitled complaint'}</h2></div>
                  <ChevronRight className="complaint-card-arrow" size={19} aria-hidden="true" />
                </div>
                <div className="complaint-card-badges"><Badge tone={STATUS_TONES[complaint.status] || 'neutral'}>{formatStatus(complaint.status)}</Badge><Badge tone={PRIORITY_TONES[complaint.priority] || 'neutral'}>{formatPriority(complaint.priority)} priority</Badge>{complaint.category && <Badge tone="neutral">{categoryLabel(complaint.category)}</Badge>}</div>
                <div className="complaint-card-meta"><span>{formatComplaintDate(complaint.created_at)}</span><span className="hod-assignee"><UserRound size={14} />{assignedLabel(complaint.assigned_officer)}</span></div>
              </div>
              <Button variant="secondary" className="complaint-view-button" onClick={() => navigate(`/hod/complaints/${encodeURIComponent(complaint.complaint_id)}`)}>Manage complaint</Button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
