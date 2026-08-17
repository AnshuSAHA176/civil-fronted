import { useEffect, useMemo, useState } from 'react'
import { FileText, RefreshCw, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { Badge } from '../../components/common/Badge'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'
import { getOfficerRTIs } from '../../features/officer/rti.api'
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

export default function OfficerRTI() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getOfficerRTIs()
      setItems(Array.isArray(response.data) ? response.data : [])
    } catch (requestError) {
      setError(getApiError(requestError).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((item) => {
      const haystack = [item.rti_id, item.subject, item.complain].filter(Boolean).join(' ').toLowerCase()
      return (!needle || haystack.includes(needle)) && (status === 'all' || item.status === status)
    })
  }, [items, query, status])

  const pendingCount = items.filter((item) => item.status === 'summitted' || item.status === 'under_review').length

  if (loading) {
    return <div className="page-loading"><Spinner /><span>Loading RTI requests…</span></div>
  }

  return (
    <section className="rti-page">
      <div className="rti-heading">
        <div>
          <p className="eyebrow">Right to Information</p>
          <h1>RTI requests</h1>
          <p>Information requests filed against complaints assigned to you. {pendingCount > 0 && `${pendingCount} need a response.`}</p>
        </div>
        <Button type="button" variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" /> Refresh
        </Button>
      </div>

      <div className="card rti-filters">
        <label className="rti-search">
          <Search size={17} aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search RTI ID, subject, or complaint" aria-label="Search RTI requests" />
        </label>
        <label className="field rti-status-filter">
          <span className="field-label">Status</span>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      {error ? (
        <ErrorState title="Unable to load RTI requests" description={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState title="No RTI requests" description="Information requests filed against your assigned complaints will appear here." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matching RTI requests" description="Try changing the search or clearing the status filter." action={<Button variant="secondary" onClick={() => { setQuery(''); setStatus('all') }}>Clear filters</Button>} />
      ) : (
        <div className="rti-list">
          {filtered.map((item) => (
            <article className="card rti-card" key={item.rti_id}>
              <div className="rti-card-icon"><FileText size={19} aria-hidden="true" /></div>
              <div className="rti-card-content">
                <p className="rti-id">{item.rti_id}</p>
                <h2>{item.subject || 'Untitled RTI request'}</h2>
                <p className="rti-complaint-ref">Complaint: {item.complain || 'Not available'}</p>
                <Badge tone={statusTone(item.status)}>{STATUS_LABELS[item.status] || item.status || 'Unknown status'}</Badge>
              </div>
              <Button type="button" variant="secondary" onClick={() => navigate(`/officer/rti/${encodeURIComponent(item.rti_id)}`)}>View details</Button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
